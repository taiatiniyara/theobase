import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyToken,
  generateResetToken,
} from "../lib/auth";
import { ROLES } from "../lib/roles";
import { logAudit, getDeviceInfo } from "../lib/audit";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function handleAuthSignup(request: Request, env: Env): Promise<Response> {
  let body: { email: string; password: string; fullName: string; conferenceName?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.email || !body.password || !body.fullName) {
    return json({ error: "email, password, and fullName are required" }, 400);
  }
  if (body.password.length < 8) {
    return json({ error: "Password must be at least 8 characters" }, 400);
  }

  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(body.email.toLowerCase().trim())
    .first();
  if (existing) {
    return json({ error: "Email already registered" }, 409);
  }

  const passwordHash = await hashPassword(body.password);

  let conferenceId: number | null = null;
  if (body.conferenceName) {
    const result = await env.DB.prepare(
      "INSERT INTO conferences (name, code) VALUES (?, ?) RETURNING id"
    )
      .bind(body.conferenceName, body.conferenceName.toLowerCase().replace(/\s+/g, "_"))
      .first<{ id: number }>();
    if (result) {
      conferenceId = result.id;
    }
  }

  const result = await env.DB.prepare(
    `INSERT INTO users (email, password_hash, role, conference_id)
     VALUES (?, ?, 'sysadmin', ?) RETURNING id`
  )
    .bind(body.email.toLowerCase().trim(), passwordHash, conferenceId)
    .first<{ id: number }>();

  if (!result) {
    return json({ error: "Failed to create user" }, 500);
  }

  await logAudit(env, {
    actor_id: result.id,
    action: "create",
    entity_type: "user",
    entity_id: result.id,
    prev_state: null,
    new_state: JSON.stringify({ email: body.email.toLowerCase().trim(), role: ROLES.sysadmin }),
    module: "auth",
    device_info: getDeviceInfo(request),
  });

  const userId = String(result.id);
  const accessToken = await signAccessToken(
    { sub: userId, role: ROLES.sysadmin, conferenceId: conferenceId ?? undefined },
    env.JWT_SECRET
  );
  const refreshToken = await signRefreshToken({ sub: userId }, env.JWT_SECRET);

  return json({
    accessToken,
    refreshToken,
    userId,
    role: ROLES.sysadmin,
    conferenceName: body.conferenceName,
  });
}

export async function handleAuthLogin(request: Request, env: Env): Promise<Response> {
  let body: { email: string; password: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.email || !body.password) {
    return json({ error: "email and password are required" }, 400);
  }

  const user = await env.DB.prepare(
    "SELECT id, password_hash, role, conference_id, member_id FROM users WHERE email = ?"
  )
    .bind(body.email.toLowerCase().trim())
    .first<{
      id: number;
      password_hash: string;
      role: string;
      conference_id: number | null;
      member_id: number | null;
    }>();

  if (!user) {
    return json({ error: "Invalid email or password" }, 401);
  }

  const valid = await verifyPassword(body.password, user.password_hash);
  if (!valid) {
    return json({ error: "Invalid email or password" }, 401);
  }

  let churchId: number | undefined;
  if (user.member_id) {
    const member = await env.DB.prepare("SELECT church_id FROM members WHERE id = ?")
      .bind(user.member_id)
      .first<{ church_id: number }>();
    churchId = member?.church_id;
  }

  const userId = String(user.id);
  const accessToken = await signAccessToken(
    {
      sub: userId,
      role: user.role,
      conferenceId: user.conference_id ?? undefined,
      churchId,
    },
    env.JWT_SECRET
  );
  const refreshToken = await signRefreshToken({ sub: userId }, env.JWT_SECRET);

  return json({
    accessToken,
    refreshToken,
    userId,
    role: user.role,
    conferenceId: user.conference_id,
    churchId,
  });
}

export async function handleAuthRefresh(request: Request, env: Env): Promise<Response> {
  let body: { refreshToken: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.refreshToken) {
    return json({ error: "refreshToken is required" }, 400);
  }

  try {
    const payload = await verifyToken(body.refreshToken, env.JWT_SECRET);
    if (payload.type !== "refresh") {
      return json({ error: "Invalid token type" }, 401);
    }

    const user = await env.DB.prepare(
      "SELECT id, role, conference_id, member_id FROM users WHERE id = ?"
    )
      .bind(Number(payload.sub))
      .first<{
        id: number;
        role: string;
        conference_id: number | null;
        member_id: number | null;
      }>();

    if (!user) {
      return json({ error: "User not found" }, 401);
    }

    let churchId: number | undefined;
    if (user.member_id) {
      const member = await env.DB.prepare("SELECT church_id FROM members WHERE id = ?")
        .bind(user.member_id)
        .first<{ church_id: number }>();
      churchId = member?.church_id;
    }

    const accessToken = await signAccessToken(
      {
        sub: payload.sub,
        role: user.role,
        conferenceId: user.conference_id ?? undefined,
        churchId,
      },
      env.JWT_SECRET
    );
    const refreshToken = await signRefreshToken({ sub: payload.sub }, env.JWT_SECRET);

    return json({ accessToken, refreshToken });
  } catch {
    return json({ error: "Invalid or expired refresh token" }, 401);
  }
}

export async function handleForgotPassword(request: Request, env: Env): Promise<Response> {
  let body: { email: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.email) {
    return json({ error: "email is required" }, 400);
  }

  const user = await env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(body.email.toLowerCase().trim())
    .first<{ id: number }>();

  if (!user) {
    return json({ message: "If the email exists, a reset link has been sent" });
  }

  const resetToken = generateResetToken();
  const expiresAt = new Date(Date.now() + 3600000).toISOString();

  await env.DB.prepare(`UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?`)
    .bind(resetToken, expiresAt, user.id)
    .run();

  return json({
    message: "If the email exists, a reset link has been sent",
    resetToken,
  });
}

export async function handleResetPassword(request: Request, env: Env): Promise<Response> {
  let body: { token: string; newPassword: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.token || !body.newPassword) {
    return json({ error: "token and newPassword are required" }, 400);
  }
  if (body.newPassword.length < 8) {
    return json({ error: "Password must be at least 8 characters" }, 400);
  }

  const user = await env.DB.prepare(
    "SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > datetime('now')"
  )
    .bind(body.token)
    .first<{ id: number }>();

  if (!user) {
    return json({ error: "Invalid or expired reset token" }, 400);
  }

  const passwordHash = await hashPassword(body.newPassword);
  await env.DB.prepare(
    "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?"
  )
    .bind(passwordHash, user.id)
    .run();

  await logAudit(env, {
    actor_id: user.id,
    action: "reset_password",
    entity_type: "user",
    entity_id: user.id,
    prev_state: null,
    new_state: JSON.stringify({ reset: true }),
    module: "auth",
    device_info: getDeviceInfo(request),
  });

  return json({ message: "Password reset successfully" });
}
