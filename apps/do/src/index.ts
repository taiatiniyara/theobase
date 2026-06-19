import { DurableObject } from "cloudflare:workers";

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

  // RPC: Broadcast a board meeting was created or updated
  async meetingUpdated(meeting: { id: string; status: string; date: string }): Promise<void> {
    this.broadcast("board", { type: "meeting_updated", meeting });
  }

  // RPC: Broadcast a board decision was recorded
  async decisionRecorded(meetingId: string, decision: { id: string; title: string; voteOutcome: string }): Promise<void> {
    this.broadcast("board", { type: "decision_recorded", meetingId, decision });
  }

  // RPC: Broadcast duty rota changes
  async rotaUpdated(date: string, slots: unknown[]): Promise<void> {
    this.broadcast("rota", { type: "rota_updated", date, slots });
  }

  // RPC: Broadcast a specific slot was assigned
  async slotAssigned(slot: { id: string; role: string; volunteerId: string; date: string }): Promise<void> {
    this.broadcast("rota", { type: "slot_assigned", slot });
  }

  // RPC: Broadcast a slot swap request
  async slotSwapRequested(slot: { id: string; fromVolunteerId: string; date: string }): Promise<void> {
    this.broadcast("rota", { type: "swap_requested", slot });
  }

  // RPC: Broadcast AV order of service update (pulpit-to-AV sync)
  async orderUpdated(date: string, items: unknown[]): Promise<void> {
    this.broadcast("av", { type: "order_updated", date, items });
  }

  // RPC: Broadcast current slide position changed (live sync)
  async slideChanged(slideIndex: number, slideLabel?: string): Promise<void> {
    this.broadcast("av", { type: "slide_changed", slideIndex, slideLabel });
  }

  // RPC: Send targeted notification to a user
  async notifyUser(userId: string, message: string): Promise<void> {
    this.broadcast("notifications", { type: "notification", userId, message, timestamp: Date.now() });
  }

  // RPC: Broadcast a global congregation notification
  async notifyCongregation(message: string): Promise<void> {
    this.broadcast("notifications", { type: "congregation_notification", message, timestamp: Date.now() });
  }

  // RPC: Schedule a duty reminder alarm
  async scheduleReminder(at: number, data: { date: string; role: string; volunteerId: string }): Promise<void> {
    await this.ctx.storage.setAlarm(at);
    await this.ctx.storage.put("pendingReminder", data);
  }

  // Alarm handler: fires at scheduled time
  override async alarm(): Promise<void> {
    const data = await this.ctx.storage.get<{ date: string; role: string; volunteerId: string }>("pendingReminder");
    if (data) {
      this.broadcast("notifications", {
        type: "duty_reminder",
        date: data.date,
        role: data.role,
        volunteerId: data.volunteerId,
        timestamp: Date.now(),
      });
      await this.ctx.storage.delete("pendingReminder");
    }
  }

  // RPC: Get connected client count (for monitoring)
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
      try { ws.send(msg); } catch { /* client disconnected between check and send */ }
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
