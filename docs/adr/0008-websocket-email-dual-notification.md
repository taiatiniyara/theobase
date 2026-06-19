# WebSocket + email dual-channel notifications

All notifications are delivered over two channels: WebSocket (in-app, real-time)
and email (guaranteed delivery). No push notifications are used.

**Why:** When a volunteer has the PWA open, WebSocket toasts deliver duty
reminders, board meeting updates, and receipt verification status changes
instantly. When the app is closed or the volunteer is offline, email guarantees
the notification still reaches them. This dual-channel approach eliminates the
iOS PWA push-notification limitation — the most commonly cited reason to avoid
PWA-only delivery.

**Consequences:** Email delivery adds latency compared to native push
notifications, but for Theobase's use cases (Sabbath duty reminders sent 24+
hours in advance, audit preparation notices days ahead), this latency is
acceptable. The Durable Object schedules notification alarms and dispatches both
WebSocket and email channels from a single code path.

**Rejected:** Native push notifications (require native app, reintroduce the
store dependency). SMS (costs money per message, variable deliverability across
regions). Email-only (loses the real-time collaboration experience).
