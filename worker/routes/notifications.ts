import { authenticate } from "../lib/middleware";
import { createDb } from "../lib/db";
import { NotificationRepo, type NotificationRow } from "../repos/notifications";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function toNotificationResponse(n: NotificationRow) {
  return {
    id: n.id,
    recipient_user_id: n.recipientUserId,
    type: n.type,
    entity_type: n.entityType,
    entity_id: n.entityId,
    message: n.message,
    read: n.read,
    created_at: n.createdAt,
  };
}

export async function handleGetNotifications(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const unreadOnly = url.searchParams.get("unread") === "1";

  const repo = new NotificationRepo(createDb(env));
  const notifications = await repo.findAll(Number(auth.userId), unreadOnly);

  return json({ notifications: notifications.map(toNotificationResponse) });
}

export async function handleMarkNotificationRead(
  request: Request,
  env: Env,
  notificationId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const repo = new NotificationRepo(createDb(env));
  const success = await repo.markRead(notificationId, Number(auth.userId));

  if (!success) {
    return json({ error: "Notification not found" }, 404);
  }

  return json({ success: true });
}

export async function handleMarkAllRead(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const repo = new NotificationRepo(createDb(env));
  await repo.markAllRead(Number(auth.userId));

  return json({ success: true });
}

export async function createNotification(
  env: Env,
  recipientUserId: number,
  type: string,
  entityType: string,
  entityId: number,
  message: string
): Promise<void> {
  try {
    const repo = new NotificationRepo(createDb(env));
    await repo.create({ recipientUserId, type, entityType, entityId, message });
  } catch {
    // Fire-and-forget: never fail a mutation because notification insert failed
  }
}
