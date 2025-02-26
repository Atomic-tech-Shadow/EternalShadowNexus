import { WebSocket, WebSocketServer } from "ws";
import type { Server } from "http";
import type { Express } from "express";

export function setupWebSocket(server: Server, app: Express) {
  const wss = new WebSocketServer({ 
    server,
    path: "/ws",
    clientTracking: true
  });

  // Store active connections
  const clients = new Map<number, WebSocket>();

  wss.on("connection", (ws, req) => {
    // Get user ID from session
    const userId = (req as any).session?.passport?.user;
    if (!userId) {
      ws.close();
      return;
    }

    console.log(`WebSocket client connected: ${userId}`);

    // Store connection
    clients.set(userId, ws);

    // Send a ping every 30 seconds to keep the connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    ws.on("close", () => {
      console.log(`WebSocket client disconnected: ${userId}`);
      clients.delete(userId);
      clearInterval(pingInterval);
    });

    ws.on("error", (error) => {
      console.error(`WebSocket error for client ${userId}:`, error);
      ws.close();
    });
  });

  // Add method to broadcast notifications
  app.locals.broadcastNotification = (userId: number, notification: any) => {
    const client = clients.get(userId);
    if (client?.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(notification));
      } catch (error) {
        console.error(`Error sending notification to client ${userId}:`, error);
        client.close();
      }
    }
  };
}