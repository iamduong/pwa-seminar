import { useEffect, useState } from "react";

const VISITOR_ID_KEY = "pwa-seminar:visitor-id";
const HEARTBEAT_INTERVAL_MS = 25_000;
const MAX_RECONNECT_DELAY_MS = 10_000;

type PresenceRole = "visitor" | "dashboard";

type PresenceMessage = {
  type: "presence:update";
  connected_visitors: number;
};

function getWebSocketBaseUrl() {
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  const url = new URL(apiBaseUrl || window.location.origin, window.location.origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = url.pathname.replace(/\/$/, "");
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function getVisitorId() {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

function getPresenceUrl(role: PresenceRole) {
  const endpoint = role === "visitor"
    ? `/ws/presence/visitor/${encodeURIComponent(getVisitorId())}`
    : "/ws/presence/dashboard";
  return `${getWebSocketBaseUrl()}${endpoint}`;
}

export function usePresenceSocket(role: PresenceRole) {
  const [connectedVisitors, setConnectedVisitors] = useState<number>();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let active = true;
    let socket: WebSocket | undefined;
    let heartbeatId: number | undefined;
    let reconnectId: number | undefined;
    let reconnectAttempt = 0;

    const clearHeartbeat = () => {
      if (heartbeatId !== undefined) window.clearInterval(heartbeatId);
      heartbeatId = undefined;
    };

    const connect = () => {
      if (!active) return;
      socket = new WebSocket(getPresenceUrl(role));

      socket.onopen = () => {
        reconnectAttempt = 0;
        setIsConnected(true);
        heartbeatId = window.setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) socket.send("ping");
        }, HEARTBEAT_INTERVAL_MS);
      };

      socket.onmessage = (event) => {
        if (role !== "dashboard") return;
        try {
          const message = JSON.parse(event.data as string) as PresenceMessage;
          if (message.type === "presence:update" && Number.isInteger(message.connected_visitors)) {
            setConnectedVisitors(message.connected_visitors);
          }
        } catch {
          // Ignore messages that do not follow the presence contract.
        }
      };

      socket.onclose = () => {
        clearHeartbeat();
        setIsConnected(false);
        if (!active) return;

        const delay = Math.min(1_000 * 2 ** reconnectAttempt, MAX_RECONNECT_DELAY_MS);
        reconnectAttempt += 1;
        reconnectId = window.setTimeout(connect, delay);
      };

      socket.onerror = () => socket?.close();
    };

    connect();
    return () => {
      active = false;
      clearHeartbeat();
      if (reconnectId !== undefined) window.clearTimeout(reconnectId);
      socket?.close();
    };
  }, [role]);

  return { connectedVisitors, isConnected };
}
