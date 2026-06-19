import { DurableObject } from "cloudflare:workers";

export default {
  async fetch(_request: Request): Promise<Response> {
    return new Response("Theobase DO Worker", { status: 200 });
  },
};

const CHANNELS = ["board", "rota", "av", "notifications"] as const;

interface BroadcastMessage {
  type: string;
  channel?: string;
  [key: string]: unknown;
}

export class CongregationDO extends DurableObject {
  private clients: Map<string, Set<WebSocket>> = new Map();

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.headers.get("Upgrade") === "websocket") {
      const channel = url.searchParams.get("channel") || "board";
      if (!CHANNELS.includes(channel as typeof CHANNELS[number])) {
        return new Response("Invalid channel", { status: 400 });
      }
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server, [channel]);
      this.addClient(channel, server);
      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response("Congregation DO", { status: 200 });
  }

  async meetingUpdated(meeting: { id: string; status: string; date: string }): Promise<void> {
    this.broadcast("board", { type: "meeting_updated", meeting });
  }

  async decisionRecorded(meetingId: string, decision: { id: string; title: string; voteOutcome: string }): Promise<void> {
    this.broadcast("board", { type: "decision_recorded", meetingId, decision });
  }

  async rotaUpdated(date: string, slots: unknown[]): Promise<void> {
    this.broadcast("rota", { type: "rota_updated", date, slots });
  }

  async slotAssigned(slot: { id: string; role: string; volunteerId: string; date: string }): Promise<void> {
    this.broadcast("rota", { type: "slot_assigned", slot });
  }

  async slotSwapRequested(slot: { id: string; fromVolunteerId: string; date: string }): Promise<void> {
    this.broadcast("rota", { type: "swap_requested", slot });
  }

  async orderUpdated(date: string, items: unknown[]): Promise<void> {
    this.broadcast("av", { type: "order_updated", date, items });
  }

  async slideChanged(slideIndex: number, slideLabel?: string): Promise<void> {
    this.broadcast("av", { type: "slide_changed", slideIndex, slideLabel });
  }

  async notifyUser(userId: string, message: string): Promise<void> {
    this.broadcast("notifications", { type: "notification", userId, message, timestamp: Date.now() });
  }

  async notifyCongregation(message: string): Promise<void> {
    this.broadcast("notifications", { type: "congregation_notification", message, timestamp: Date.now() });
  }

  async scheduleReminder(at: number, data: { date: string; role: string; volunteerId: string }): Promise<void> {
    await this.ctx.storage.setAlarm(at);
    await this.ctx.storage.put("pendingReminder", data);
  }

  override async alarm(): Promise<void> {
    const data = await this.ctx.storage.get<{ date: string; role: string; volunteerId: string }>("pendingReminder");
    if (data) {
      this.broadcast("notifications", {
        type: "duty_reminder", date: data.date, role: data.role,
        volunteerId: data.volunteerId, timestamp: Date.now(),
      });
      await this.ctx.storage.delete("pendingReminder");
    }
  }

  async connectedCount(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const channel of CHANNELS) {
      counts[channel] = this.clients.get(channel)?.size ?? 0;
    }
    return counts;
  }

  private addClient(channel: string, ws: WebSocket): void {
    if (!this.clients.has(channel)) this.clients.set(channel, new Set());
    this.clients.get(channel)!.add(ws);
  }

  private removeClient(ws: WebSocket): void {
    for (const [, clients] of this.clients) {
      clients.delete(ws);
    }
  }

  private broadcast(channel: string, data: BroadcastMessage): void {
    const clients = this.clients.get(channel);
    if (!clients) return;
    const msg = JSON.stringify(data);
    for (const ws of clients) {
      try { ws.send(msg); } catch { /* disconnected */ }
    }
  }

  override async webSocketMessage(ws: WebSocket, message: string): Promise<void> {
    try {
      const data = JSON.parse(message) as { type: string; channel?: string };
      if (data.type === "subscribe" && data.channel && CHANNELS.includes(data.channel as typeof CHANNELS[number])) {
        this.removeClient(ws);
        this.addClient(data.channel, ws);
        ws.send(JSON.stringify({ type: "subscribed", channel: data.channel }));
      } else if (data.type === "ping") {
        ws.send(JSON.stringify({ type: "pong" }));
      }
    } catch {
      ws.send(JSON.stringify({ error: "Invalid message format" }));
    }
  }

  override async webSocketClose(ws: WebSocket): Promise<void> {
    this.removeClient(ws);
  }

  override async webSocketError(ws: WebSocket): Promise<void> {
    this.removeClient(ws);
  }
}
