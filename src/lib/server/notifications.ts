import type { IncomingMessage } from "node:http";

import { WebSocket, WebSocketServer } from "ws";

import { getCurrentUser } from "@/lib/server/auth";
import type { FootballRow } from "@/lib/server/football-model";

export type SavedRecordNotification = {
  type: "saved_record_updated";
  savedRecordId: number;
  message: string;
  row: FootballRow;
  createdAt: string;
};

type NotificationState = {
  socketsByUserId: Map<number, Set<WebSocket>>;
  websocketServer: WebSocketServer | null;
};

declare global {
  var __footballNotifications: NotificationState | undefined;
}

const notificationState = (globalThis.__footballNotifications ||= {
  socketsByUserId: new Map<number, Set<WebSocket>>(),
  websocketServer: null,
});

function getWebSocketPort() {
  if (process.env.WS_PORT) return Number(process.env.WS_PORT);
  return (Number(process.env.PORT || process.env.NITRO_PORT || 3000) || 3000) + 1;
}

function send(socket: WebSocket, payload: unknown) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

function registerSocket(userId: number, socket: WebSocket) {
  const sockets = notificationState.socketsByUserId.get(userId) || new Set<WebSocket>();
  sockets.add(socket);
  notificationState.socketsByUserId.set(userId, sockets);

  socket.on("close", () => {
    sockets.delete(socket);
    if (sockets.size === 0) notificationState.socketsByUserId.delete(userId);
  });
}

async function userFromUpgradeRequest(request: IncomingMessage) {
  const cookie = request.headers.cookie || "";
  const host = request.headers.host || "localhost";
  return getCurrentUser(
    new Request(`http://${host}/ws/notifications`, {
      headers: { cookie },
    }),
  );
}

export function startNotificationServer() {
  if (notificationState.websocketServer || process.env.DISABLE_WEBSOCKET_NOTIFICATIONS === "true")
    return;

  notificationState.websocketServer = new WebSocketServer({
    host: process.env.WS_HOST || "0.0.0.0",
    port: getWebSocketPort(),
    path: "/ws/notifications",
  });

  notificationState.websocketServer.on("connection", (socket, request) => {
    void userFromUpgradeRequest(request)
      .then((user) => {
        if (!user) {
          socket.close(1008, "unauthorized");
          return;
        }

        registerSocket(user.id, socket);
        send(socket, { type: "connected" });
      })
      .catch(() => {
        socket.close(1011, "auth_failed");
      });
  });

  notificationState.websocketServer.on("error", (error) => {
    console.error("Notification websocket server failed", error);
  });
}

export function notifySavedRecordUpdated(userId: number, notification: SavedRecordNotification) {
  const sockets = notificationState.socketsByUserId.get(userId);
  if (!sockets?.size) return;

  for (const socket of sockets) {
    send(socket, notification);
  }
}
