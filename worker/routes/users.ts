import { hashPassword, generateResetToken } from "../lib/auth";
import { authenticate, authorize } from "../lib/middleware";
import { PERMISSIONS, ROLES } from "../lib/roles";
import { parseCsv, validateCsvHeaders } from "../lib/csv";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
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

  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(body.email.toLowerCase().trim())
    .first();
  if (existing) {
    return json({ error: "User with this email already exists" }, 409);
  }

  const tempPassword = generateResetToken().slice(0, 16);
  const passwordHash = await hashPassword(tempPassword);

  const result = await env.DB.prepare(
    `INSERT INTO users (email, password_hash, role, conference_id, member_id)
     VALUES (?, ?, ?, ?, ?) RETURNING id`
  )
    .bind(
      body.email.toLowerCase().trim(),
      passwordHash,
      body.role,
      body.conferenceId ?? auth.conferenceId ?? null,
      body.memberId ?? null
    )
    .first<{ id: number }>();

  if (!result) {
    return json({ error: "Failed to create user" }, 500);
  }

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

  let users;
  if (conferenceId) {
    users = await env.DB.prepare(
      `SELECT id, email, role, conference_id, member_id, created_at
       FROM users WHERE conference_id = ?
       ORDER BY created_at DESC`
    )
      .bind(Number(conferenceId))
      .all();
  } else {
    users = await env.DB.prepare(
      `SELECT id, email, role, conference_id, member_id, created_at
       FROM users ORDER BY created_at DESC`
    ).all();
  }

  return json({ users: users.results });
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

    const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?")
      .bind(email)
      .first();
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

    const result = await env.DB.prepare(
      `INSERT INTO users (email, password_hash, role, conference_id, member_id)
       VALUES (?, ?, ?, ?, ?) RETURNING id`
    )
      .bind(email, passwordHash, role, body.conferenceId, memberId)
      .first<{ id: number }>();

    if (result) {
      created.push({ email, role, tempPassword, id: result.id });
    } else {
      errors.push({ row: i, message: "Failed to create user" });
    }
  }

  return json({ created, errors });
}

export async function handleGetMe(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const user = await env.DB.prepare(
    "SELECT id, email, role, conference_id, member_id FROM users WHERE id = ?"
  )
    .bind(Number(auth.userId))
    .first<{
      id: number;
      email: string;
      role: string;
      conference_id: number | null;
      member_id: number | null;
    }>();

  if (!user) {
    return json({ error: "User not found" }, 404);
  }

  let conference = null;
  let church = null;

  if (user.conference_id) {
    conference = await env.DB.prepare("SELECT id, name, code FROM conferences WHERE id = ?")
      .bind(user.conference_id)
      .first();
  }

  if (user.member_id) {
    const member = await env.DB.prepare("SELECT church_id FROM members WHERE id = ?")
      .bind(user.member_id)
      .first<{ church_id: number }>();
    if (member) {
      church = await env.DB.prepare("SELECT id, name, type FROM churches WHERE id = ?")
        .bind(member.church_id)
        .first();
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
