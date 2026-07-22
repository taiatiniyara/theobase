import { authenticate } from "../lib/middleware";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function handleGetNotifications(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const unreadOnly = url.searchParams.get("unread") === "1";

  let query = `SELECT n.*, u.email as actor_email
    FROM notifications n
    LEFT JOIN users u ON n.entity_id = u.id
    WHERE n.recipient_user_id = ?`;
  const params: (string | number)[] = [Number(auth.userId)];

  if (unreadOnly) {
    query += " AND n.read = 0";
  }
  query += " ORDER BY n.created_at DESC LIMIT 50";

  const result = await env.DB.prepare(query)
    .bind(...params)
    .all();

  return json({ notifications: result.results });
}

export async function handleMarkNotificationRead(
  request: Request,
  env: Env,
  notificationId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const existing = await env.DB.prepare(
    "SELECT id, recipient_user_id FROM notifications WHERE id = ?"
  )
    .bind(notificationId)
    .first<{ id: number; recipient_user_id: number }>();

  if (!existing) {
    return json({ error: "Notification not found" }, 404);
  }
  if (existing.recipient_user_id !== Number(auth.userId)) {
    return json({ error: "Not your notification" }, 403);
  }

  await env.DB.prepare("UPDATE notifications SET read = 1 WHERE id = ?").bind(notificationId).run();

  return json({ success: true });
}

export async function handleMarkAllRead(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  await env.DB.prepare("UPDATE notifications SET read = 1 WHERE recipient_user_id = ? AND read = 0")
    .bind(Number(auth.userId))
    .run();

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
    await env.DB.prepare(
      `INSERT INTO notifications (recipient_user_id, type, entity_type, entity_id, message)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(recipientUserId, type, entityType, entityId, message)
      .run();
  } catch {
    // Fire-and-forget: never fail a mutation because notification insert failed
  }
}
