import { toast } from "./toast";

type Channel = "board" | "rota" | "av" | "notifications";

interface RealtimeOptions {
  channels?: Channel[];
  onMessage?: (data: any) => void;
}

export function connectRealtime(token: string, options: RealtimeOptions = {}) {
  const { channels = ["board", "rota", "notifications"] as Channel[], onMessage } = options;

  const wsUrl = `wss://api.theobase.net/do?token=${encodeURIComponent(token)}`;

  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout>;
  let currentChannel = 0;

  function connect() {
    try {
      ws = new WebSocket(wsUrl);
    } catch {
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      currentChannel = 0;
      subscribeNext();
    };

    function subscribeNext() {
      if (currentChannel < channels.length && ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "subscribe", channel: channels[currentChannel] }));
        currentChannel++;
        setTimeout(subscribeNext, 100);
      }
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data);

        if (data.type === "meeting_updated") {
          toast("Board meeting updated");
        } else if (data.type === "decision_recorded") {
          toast("New decision recorded");
        } else if (data.type === "rota_updated") {
          toast("Duty rota updated");
        } else if (data.type === "order_updated") {
          toast("Order of service updated");
        } else if (data.type === "duty_reminder") {
          toast("Upcoming duty reminder");
        } else if (data.type === "notification") {
          toast(data.message || "New notification");
        }
      } catch {}
    };

    ws.onclose = () => {
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws?.close();
    };
  }

  function scheduleReconnect() {
    reconnectTimer = setTimeout(connect, 5000);
  }

  connect();

  return {
    close() {
      clearTimeout(reconnectTimer);
      ws?.close();
    },
    get socket() { return ws; },
  };
}
