import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyToken,
  generateResetToken,
  generateVerifyToken,
  verifyEmailToken,
  verifyInviteToken,
  isTokenBlacklisted,
  blacklistToken,
} from "../lib/auth";
import { ROLES } from "../lib/roles";
import { logAudit, getDeviceInfo } from "../lib/audit";
import { createDb } from "../lib/db";
import { UserRepo } from "../repos/users";
import { ConferenceRepo } from "../repos/org";
import { MemberRepo } from "../repos/members";
import { sendResetEmail, sendVerifyEmail } from "../lib/email";
import { json } from "../lib/response";
import type { AuthContext } from "../lib/middleware";

export async function handleAuthSignup(
  request: Request,
  env: Env,
  _auth: AuthContext
): Promise<Response> {
  let body: {
    email: string;
    password: string;
    fullName: string;
    conferenceName?: string;
    inviteToken?: string;
  };
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

  const userRepo = new UserRepo(createDb(env));

  const existing = await userRepo.findByEmail(body.email.toLowerCase().trim());
  if (existing) {
    return json({ error: "Email already registered" }, 409);
  }

  const userCount = await userRepo.count();
  const isBootstrap = userCount === 0;

  let assignedConferenceId: number | null = null;
  let assignedRole: string | null = null;

  if (body.inviteToken) {
    try {
      const invite = await verifyInviteToken(body.inviteToken, env.JWT_SECRET);
      if (invite.email.toLowerCase().trim() !== body.email.toLowerCase().trim()) {
        return json({ error: "This invite is for a different email address" }, 403);
      }
      assignedConferenceId = invite.conferenceId;
      assignedRole = invite.role;
    } catch {
      return json({ error: "Invalid or expired invite link" }, 403);
    }
  } else if (isBootstrap) {
    assignedRole = "sysadmin";
  } else {
    return json({ error: "An invite link is required to sign up" }, 403);
  }

  const passwordHash = await hashPassword(body.password);

  let conferenceId: number | null = assignedConferenceId;
  if (!conferenceId && body.conferenceName) {
    const conferenceRepo = new ConferenceRepo(createDb(env));
    const result = await conferenceRepo.create({
      name: body.conferenceName,
      code: body.conferenceName.toLowerCase().replace(/\s+/g, "_"),
    });
    conferenceId = result.id;

    if (env.CONFERENCE_DO) {
      const doId = env.CONFERENCE_DO.idFromName(`provision-${result.id}`);
      const stub = env.CONFERENCE_DO.get(doId);
      await stub.provision(result.id, result.code);
    }
  }

  const isTestBypass =
    env.DISABLE_EMAIL_VERIFICATION === "true" &&
    request.headers.get("X-Theobase-Test-Bypass") === "email-verification";

  const result = await userRepo.create({
    email: body.email.toLowerCase().trim(),
    passwordHash,
    role: assignedRole ?? "sysadmin",
    conferenceId: conferenceId ?? undefined,
    emailVerified: isTestBypass ? 1 : 0,
  });

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

  if (isTestBypass) {
    const userId = String(result.id);
    const accessToken = await signAccessToken(
      { sub: userId, role: ROLES.sysadmin, conferenceId: conferenceId ?? undefined },
      env.JWT_SECRET
    );
    const refreshToken = await signRefreshToken({ sub: userId }, env.JWT_SECRET);
    return json({ accessToken, refreshToken, userId, role: ROLES.sysadmin });
  }

  const verifyToken = await generateVerifyToken(result.id, env.JWT_SECRET);
  await sendVerifyEmail(env, body.email.toLowerCase().trim(), verifyToken);

  return json({
    message: "Account created. Check your email to verify your address.",
  });
}

export async function handleAuthLogin(
  request: Request,
  env: Env,
  _auth: AuthContext
): Promise<Response> {
  let body: { email: string; password: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.email || !body.password) {
    return json({ error: "email and password are required" }, 400);
  }

  const userRepo = new UserRepo(createDb(env));

  const user = await userRepo.findByEmail(body.email.toLowerCase().trim());
  if (!user) {
    return json({ error: "Invalid email or password" }, 401);
  }

  if (user.active === 0) {
    return json({ error: "Account has been deactivated. Contact your system administrator." }, 403);
  }

  if ((user.emailVerified ?? 1) === 0) {
    return json({ error: "Please verify your email address before logging in." }, 403);
  }

  const valid = await verifyPassword(body.password, user.passwordHash);
  if (!valid) {
    return json({ error: "Invalid email or password" }, 401);
  }

  let churchId: number | undefined;
  if (user.memberId) {
    const memberRepo = new MemberRepo(createDb(env));
    const member = await memberRepo.findById(user.memberId);
    churchId = member?.churchId;
  }

  const userId = String(user.id);
  const accessToken = await signAccessToken(
    {
      sub: userId,
      role: user.role,
      conferenceId: user.conferenceId ?? undefined,
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
    conferenceId: user.conferenceId,
    churchId,
  });
}

export async function handleAuthRefresh(
  request: Request,
  env: Env,
  _auth: AuthContext
): Promise<Response> {
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

    if (payload.jti) {
      const blacklisted = await isTokenBlacklisted(env.DB, payload.jti);
      if (blacklisted) {
        return json({ error: "Token has been revoked" }, 401);
      }
    }

    const userRepo = new UserRepo(createDb(env));

    const user = await userRepo.findById(Number(payload.sub));
    if (!user) {
      return json({ error: "User not found" }, 401);
    }

    if (user.active === 0) {
      return json({ error: "Account deactivated" }, 403);
    }

    let churchId: number | undefined;
    if (user.memberId) {
      const memberRepo = new MemberRepo(createDb(env));
      const member = await memberRepo.findById(user.memberId);
      churchId = member?.churchId;
    }

    const accessToken = await signAccessToken(
      {
        sub: payload.sub,
        role: user.role,
        conferenceId: user.conferenceId ?? undefined,
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

export async function handleAuthLogout(
  request: Request,
  env: Env,
  _auth: AuthContext
): Promise<Response> {
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
    if (payload.jti && payload.exp) {
      const expiresAt = new Date(payload.exp * 1000).toISOString();
      await blacklistToken(env.DB, payload.jti, expiresAt);
    }
  } catch {
    // Token is already invalid — still safe to ignore
  }

  return json({ message: "Logged out successfully" });
}

export async function handleVerifyEmail(
  request: Request,
  env: Env,
  _auth: AuthContext
): Promise<Response> {
  let body: { token: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.token) {
    return json({ error: "token is required" }, 400);
  }

  try {
    const payload = await verifyEmailToken(body.token, env.JWT_SECRET);
    const userId = Number(payload.sub);
    const userRepo = new UserRepo(createDb(env));
    await userRepo.verifyEmail(userId);
    return json({ message: "Email verified successfully." });
  } catch {
    return json({ error: "Invalid or expired verification token" }, 400);
  }
}

export async function handleForgotPassword(
  request: Request,
  env: Env,
  _auth: AuthContext
): Promise<Response> {
  let body: { email: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.email) {
    return json({ error: "email is required" }, 400);
  }

  const userRepo = new UserRepo(createDb(env));

  const user = await userRepo.findByEmail(body.email.toLowerCase().trim());
  if (!user) {
    return json({ message: "If the email exists, a reset link has been sent" });
  }

  const resetToken = generateResetToken();
  const expiresAt = new Date(Date.now() + 3600000).toISOString();

  await userRepo.update(user.id, { resetToken, resetTokenExpires: expiresAt });

  await sendResetEmail(env, user.email, resetToken);

  return json({
    message: "If the email exists, a reset link has been sent",
  });
}

export async function handleResetPassword(
  request: Request,
  env: Env,
  _auth: AuthContext
): Promise<Response> {
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

  const userRepo = new UserRepo(createDb(env));

  const user = await userRepo.findByResetToken(body.token);
  if (!user) {
    return json({ error: "Invalid or expired reset token" }, 400);
  }

  const passwordHash = await hashPassword(body.newPassword);
  await userRepo.update(user.id, { passwordHash, resetToken: null, resetTokenExpires: null });

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
