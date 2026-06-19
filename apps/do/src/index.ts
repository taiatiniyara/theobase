import { DurableObject } from "cloudflare:workers";

interface BoardroomState {
  meetings: Map<string, { id: string; agenda: string; status: string; date: string }>;
  connectedClients: Set<WebSocket>;
}

export class CongregationDO extends DurableObject {
  private state: BoardroomState = { meetings: new Map(), connectedClients: new Set() };

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/ws" && request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server);
      this.state.connectedClients.add(server);
      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response("Boardroom DO", { status: 200 });
  }

  async webSocketMessage(ws: WebSocket, message: string) {
    try {
      const data = JSON.parse(message);
      // Broadcast to all other connected clients
      const response = JSON.stringify({ channel: "board", ...data });
      for (const client of this.state.connectedClients) {
        if (client !== ws) {
          client.send(response);
        }
      }
    } catch {
      ws.send(JSON.stringify({ error: "Invalid message format" }));
    }
  }

  async webSocketClose(ws: WebSocket) {
    this.state.connectedClients.delete(ws);
  }
}
