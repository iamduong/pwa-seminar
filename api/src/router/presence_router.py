from uuid import UUID

import jwt
from core.provider.postgres import SessionFactory
from core.security import TokenType, decode_token
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from service.analytics_event_service import AnalyticsEventService


router = APIRouter(prefix="/ws/presence", tags=["Presence WebSocket"])


class PresenceManager:
    """Publishes database-backed visitor metrics to connected dashboards."""

    def __init__(self) -> None:
        self._dashboards: set[WebSocket] = set()

    async def connect_dashboard(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._dashboards.add(websocket)
        await self._send_metrics(websocket, await _get_presence_counts())

    def disconnect_dashboard(self, websocket: WebSocket) -> None:
        self._dashboards.discard(websocket)

    async def _send_metrics(
        self,
        websocket: WebSocket,
        counts: tuple[int, int],
    ) -> None:
        connected_visitors, total_connections = counts
        await websocket.send_json(
            {
                "type": "presence:update",
                "connected_visitors": connected_visitors,
                "total_connections": total_connections,
            }
        )

    async def broadcast_metrics(self) -> None:
        counts = await _get_presence_counts()
        disconnected: list[WebSocket] = []
        for dashboard in tuple(self._dashboards):
            try:
                await self._send_metrics(dashboard, counts)
            except (RuntimeError, WebSocketDisconnect):
                disconnected.append(dashboard)

        for dashboard in disconnected:
            self.disconnect_dashboard(dashboard)


presence_manager = PresenceManager()


async def _get_presence_counts() -> tuple[int, int]:
    async with SessionFactory() as database:
        return await AnalyticsEventService(database).get_presence_counts()


async def _keep_connection_open(websocket: WebSocket) -> None:
    while True:
        # Receiving heartbeat messages also lets the server notice closed clients.
        await websocket.receive_text()


@router.websocket("/visitor/{visitor_id}")
async def visitor_presence(websocket: WebSocket, visitor_id: str) -> None:
    try:
        session_id = UUID(visitor_id)
    except ValueError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    event_id: UUID | None = None
    try:
        async with SessionFactory() as database:
            event = await AnalyticsEventService(database).connect_visitor(session_id)
            event_id = event.id

        await websocket.accept()
        await presence_manager.broadcast_metrics()
        await _keep_connection_open(websocket)
    except WebSocketDisconnect:
        pass
    finally:
        if event_id is not None:
            async with SessionFactory() as database:
                await AnalyticsEventService(database).disconnect_visitor(event_id)
            await presence_manager.broadcast_metrics()


@router.websocket("/dashboard")
async def dashboard_presence(websocket: WebSocket) -> None:
    token = websocket.cookies.get("access_token")
    if token is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        decode_token(token, TokenType.ACCESS)
    except (jwt.PyJWTError, ValueError):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    await presence_manager.connect_dashboard(websocket)
    try:
        await _keep_connection_open(websocket)
    except WebSocketDisconnect:
        pass
    finally:
        presence_manager.disconnect_dashboard(websocket)
