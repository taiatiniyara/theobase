import { hashPassword, generateResetToken } from "../lib/auth";
import { authenticate, authorize } from "../lib/middleware";
import { PERMISSIONS, ROLES } from "../lib/roles";
import { parseCsv, validateCsvHeaders } from "../lib/csv";
import { logAudit, getDeviceInfo } from "../lib/audit";
import { createDb } from "../lib/db";
import { UserRepo } from "../repos/users";
import { ConferenceRepo, ChurchRepo } from "../repos/org";
import { json } from "../lib/response";

function toUserResponse(u: {
  id: number;
  email: string;
  role: string;
  conferenceId: number | null;
  memberId: number | null;
  createdAt: string | null;
}) {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    conference_id: u.conferenceId,
    member_id: u.memberId,
    created_at: u.createdAt,
  };
}

export async function handleInviteUser(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["users:invite"]!);
  if (forbidden) return forbidden;

  let body: {
    email: string;
    role: string;
    conferenceId?: number;
    memberId?: number;
    churchId?: number;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.email || !body.role) {
    return json({ error: "email and role are required" }, 400);
  }

  const validRoles = Object.values(ROLES);
  if (!validRoles.includes(body.role as (typeof ROLES)[keyof typeof ROLES])) {
    return json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` }, 400);
  }

  const userRepo = new UserRepo(createDb(env));

  const existing = await userRepo.findByEmail(body.email.toLowerCase().trim());
  if (existing) {
    return json({ error: "User with this email already exists" }, 409);
  }

  const tempPassword = generateResetToken().slice(0, 16);
  const passwordHash = await hashPassword(tempPassword);

  const result = await userRepo.create({
    email: body.email.toLowerCase().trim(),
    passwordHash,
    role: body.role,
    conferenceId: body.conferenceId ?? auth.conferenceId ?? undefined,
    memberId: body.memberId ?? undefined,
  });

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "create",
    entity_type: "user",
    entity_id: result.id,
    prev_state: null,
    new_state: JSON.stringify({ email: body.email.toLowerCase().trim(), role: body.role }),
    module: "users",
    device_info: getDeviceInfo(request),
  });

  return json(
    {
      id: result.id,
      email: body.email.toLowerCase().trim(),
      role: body.role,
      tempPassword,
      message: "User invited. Share the temporary password securely.",
    },
    201
  );
}

export async function handleGetUsers(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["users:invite"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const conferenceId = url.searchParams.get("conference_id");

  const userRepo = new UserRepo(createDb(env));
  const users = await userRepo.findAll(conferenceId ? Number(conferenceId) : undefined);

  return json({ users: users.map(toUserResponse) });
}

export async function handleUpdateUser(
  request: Request,
  env: Env,
  userId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["users:invite"]!);
  if (forbidden) return forbidden;

  let body: { role?: string; active?: boolean; resetPassword?: boolean };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const userRepo = new UserRepo(createDb(env));

  const user = await userRepo.findById(userId);
  if (!user) {
    return json({ error: "User not found" }, 404);
  }

  if (body.role) {
    const validRoles = Object.values(ROLES);
    if (!validRoles.includes(body.role as (typeof ROLES)[keyof typeof ROLES])) {
      return json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` }, 400);
    }
    await userRepo.update(userId, { role: body.role });
    await logAudit(env, {
      actor_id: Number(auth.userId),
      action: "update_role",
      entity_type: "user",
      entity_id: userId,
      prev_state: JSON.stringify({ role: user.role }),
      new_state: JSON.stringify({ role: body.role }),
      module: "users",
      device_info: getDeviceInfo(request),
    });
  }

  if (body.active !== undefined) {
    await userRepo.update(userId, { active: body.active ? 1 : 0 });
    await logAudit(env, {
      actor_id: Number(auth.userId),
      action: body.active ? "activate" : "deactivate",
      entity_type: "user",
      entity_id: userId,
      prev_state: JSON.stringify({ active: true }),
      new_state: JSON.stringify({ active: body.active }),
      module: "users",
      device_info: getDeviceInfo(request),
    });
  }

  if (body.resetPassword) {
    const tempPassword = generateResetToken().slice(0, 16);
    const passwordHash = await hashPassword(tempPassword);
    await userRepo.update(userId, { passwordHash });
    return json({
      id: userId,
      message: "Password reset successfully",
      tempPassword,
    });
  }

  return json({ id: userId, message: "User updated successfully" });
}

export async function handleBulkInviteUsers(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["users:invite"]!);
  if (forbidden) return forbidden;

  let body: { conferenceId: number; csv: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.csv || !body.conferenceId) {
    return json({ error: "csv and conferenceId are required" }, 400);
  }

  const rows = parseCsv(body.csv);
  if (rows.length === 0) {
    return json({ error: "CSV is empty" }, 400);
  }

  const headerError = validateCsvHeaders(rows[0]!, ["email", "role", "church"]);
  if (headerError) {
    return json({ error: headerError }, 400);
  }

  const created: { email: string; role: string; tempPassword: string; id: number }[] = [];
  const errors: { row: number; message: string }[] = [];

  const userRepo = new UserRepo(createDb(env));

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]!;
    const email = row[0]?.trim().toLowerCase();
    const role = row[1]?.trim().toLowerCase();
    const churchName = row[2]?.trim();

    if (!email || !role) {
      errors.push({ row: i, message: "email and role are required" });
      continue;
    }

    const validRoles = Object.values(ROLES);
    if (!validRoles.includes(role as (typeof ROLES)[keyof typeof ROLES])) {
      errors.push({ row: i, message: `Invalid role: ${role}` });
      continue;
    }

    const existing = await userRepo.findByEmail(email);
    if (existing) {
      errors.push({ row: i, message: `User ${email} already exists` });
      continue;
    }

    let memberId: number | null = null;
    if (churchName) {
      const church = await env.DB.prepare(
        "SELECT id FROM churches WHERE name = ? AND parent_type = 'conference' AND parent_id = ?"
      )
        .bind(churchName, body.conferenceId)
        .first<{ id: number }>();
      if (church) {
        const member = await env.DB.prepare(
          "SELECT id FROM members WHERE church_id = ? AND email = ? LIMIT 1"
        )
          .bind(church.id, email)
          .first<{ id: number }>();
        if (member) {
          memberId = member.id;
        }
      }
    }

    const tempPassword = generateResetToken().slice(0, 16);
    const passwordHash = await hashPassword(tempPassword);

    try {
      const result = await userRepo.create({
        email,
        passwordHash,
        role,
        conferenceId: body.conferenceId,
        memberId: memberId ?? undefined,
      });
      created.push({ email, role, tempPassword, id: result.id });
    } catch {
      errors.push({ row: i, message: "Failed to create user" });
    }
  }

  return json({ created, errors });
}

export async function handleGetMe(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const userRepo = new UserRepo(createDb(env));

  const user = await userRepo.findUserWithChurch(Number(auth.userId));
  if (!user) {
    return json({ error: "User not found" }, 404);
  }

  let conference = null;
  let church = null;

  if (user.conference_id) {
    const conferenceRepo = new ConferenceRepo(createDb(env));
    conference = await conferenceRepo.findById(user.conference_id);
    if (conference) {
      conference = { id: conference.id, name: conference.name, code: conference.code };
    }
  }

  if (user.church_id) {
    const churchRepo = new ChurchRepo(createDb(env));
    church = await churchRepo.findById(user.church_id);
    if (church) {
      church = { id: church.id, name: church.name, type: church.type };
    }
  }

  return json({
    id: user.id,
    email: user.email,
    role: user.role,
    conference,
    church,
  });
}
