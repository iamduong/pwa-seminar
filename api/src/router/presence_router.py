from collections import defaultdict

import jwt
from core.security import TokenType, decode_token
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status


router = APIRouter(prefix="/ws/presence", tags=["Presence WebSocket"])


class PresenceManager:
    """Tracks unique visitor browsers and publishes the count to dashboards."""

    def __init__(self) -> None:
        self._visitors: dict[str, set[WebSocket]] = defaultdict(set)
        self._dashboards: set[WebSocket] = set()

    @property
    def visitor_count(self) -> int:
        return len(self._visitors)

    async def connect_visitor(self, visitor_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._visitors[visitor_id].add(websocket)
        await self._broadcast_count()

    async def disconnect_visitor(self, visitor_id: str, websocket: WebSocket) -> None:
        connections = self._visitors.get(visitor_id)
        if connections is None:
            return

        connections.discard(websocket)
        if not connections:
            self._visitors.pop(visitor_id, None)
        await self._broadcast_count()

    async def connect_dashboard(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._dashboards.add(websocket)
        await self._send_count(websocket)

    def disconnect_dashboard(self, websocket: WebSocket) -> None:
        self._dashboards.discard(websocket)

    async def _send_count(self, websocket: WebSocket) -> None:
        await websocket.send_json(
            {"type": "presence:update", "connected_visitors": self.visitor_count}
        )

    async def _broadcast_count(self) -> None:
        disconnected: list[WebSocket] = []
        for dashboard in tuple(self._dashboards):
            try:
                await self._send_count(dashboard)
            except (RuntimeError, WebSocketDisconnect):
                disconnected.append(dashboard)

        for dashboard in disconnected:
            self.disconnect_dashboard(dashboard)


presence_manager = PresenceManager()


async def _keep_connection_open(websocket: WebSocket) -> None:
    while True:
        # Receiving heartbeat messages also lets the server notice closed clients.
        await websocket.receive_text()


@router.websocket("/visitor/{visitor_id}")
async def visitor_presence(websocket: WebSocket, visitor_id: str) -> None:
    if not visitor_id or len(visitor_id) > 100:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await presence_manager.connect_visitor(visitor_id, websocket)
    try:
        await _keep_connection_open(websocket)
    except WebSocketDisconnect:
        pass
    finally:
        await presence_manager.disconnect_visitor(visitor_id, websocket)


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
