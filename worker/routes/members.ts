import { authenticate, authorize } from "../lib/middleware";
import { PERMISSIONS } from "../lib/roles";
import { logAudit, getDeviceInfo } from "../lib/audit";
import { createNotification } from "./notifications";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function validateEnum(value: string, allowed: string[], name: string): string | null {
  if (!allowed.includes(value)) {
    return `${name} must be one of: ${allowed.join(", ")}`;
  }
  return null;
}

const BAPTISM_TYPES = ["immersion", "profession_of_faith"];
const REMOVAL_REASONS = ["deceased", "missing", "apostasy"];

// ── Members ──

export async function handleGetMembers(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["members:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const churchId = url.searchParams.get("church_id");
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");

  let query = `SELECT id, church_id, household_id, full_name, preferred_name, dob, gender,
    baptism_date, baptism_type, join_date, phone, email, status, created_at, updated_at, version
    FROM members WHERE 1=1`;
  const params: (string | number)[] = [];

  if (churchId) {
    query += " AND church_id = ?";
    params.push(Number(churchId));
  }
  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  if (search) {
    query += " AND (full_name LIKE ? OR email LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  query += " ORDER BY full_name";

  const result = await env.DB.prepare(query)
    .bind(...params)
    .all<{
      id: number;
      church_id: number;
      household_id: number | null;
      full_name: string;
      preferred_name: string | null;
      dob: string | null;
      gender: string | null;
      baptism_date: string | null;
      baptism_type: string | null;
      join_date: string | null;
      phone: string | null;
      email: string | null;
      status: string;
      created_at: string;
      updated_at: string;
      version: number;
    }>();

  return json({ members: result.results });
}

export async function handleGetMember(
  request: Request,
  env: Env,
  memberId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["members:read"]!);
  if (forbidden) return forbidden;

  const member = await env.DB.prepare(
    `SELECT m.*, c.name as church_name, h.name as household_name
     FROM members m
     LEFT JOIN churches c ON m.church_id = c.id
     LEFT JOIN households h ON m.household_id = h.id
     WHERE m.id = ?`
  )
    .bind(memberId)
    .first<{
      id: number;
      church_id: number;
      household_id: number | null;
      full_name: string;
      preferred_name: string | null;
      dob: string | null;
      gender: string | null;
      baptism_date: string | null;
      baptism_type: string | null;
      join_date: string | null;
      prev_church_id: number | null;
      phone: string | null;
      email: string | null;
      address: string | null;
      marital_status: string | null;
      status: string;
      status_date: string | null;
      created_at: string;
      updated_at: string;
      version: number;
      church_name: string | null;
      household_name: string | null;
    }>();

  if (!member) {
    return json({ error: "Member not found" }, 404);
  }

  const positions = await env.DB.prepare(
    `SELECT p.id, p.name, p.module, mp.start_date, mp.end_date
     FROM member_positions mp
     JOIN positions p ON mp.position_id = p.id
     WHERE mp.member_id = ?
     ORDER BY p.name`
  )
    .bind(memberId)
    .all();

  return json({ ...member, positions: positions.results });
}

export async function handleCreateMember(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["members:write"]!);
  if (forbidden) return forbidden;

  let body: {
    churchId: number;
    householdId?: number;
    fullName: string;
    preferredName?: string;
    dob?: string;
    gender?: string;
    baptismDate?: string;
    baptismType?: string;
    joinDate?: string;
    prevChurchId?: number;
    phone?: string;
    email?: string;
    address?: string;
    maritalStatus?: string;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.churchId || !body.fullName) {
    return json({ error: "churchId and fullName are required" }, 400);
  }

  if (body.baptismType) {
    const err = validateEnum(body.baptismType, BAPTISM_TYPES, "baptismType");
    if (err) return json({ error: err }, 400);
  }

  const church = await env.DB.prepare("SELECT id FROM churches WHERE id = ?")
    .bind(body.churchId)
    .first();
  if (!church) {
    return json({ error: "Church not found" }, 404);
  }

  const result = await env.DB.prepare(
    `INSERT INTO members (church_id, household_id, full_name, preferred_name, dob, gender,
      baptism_date, baptism_type, join_date, prev_church_id, phone, email, address, marital_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
  )
    .bind(
      body.churchId,
      body.householdId ?? null,
      body.fullName,
      body.preferredName ?? null,
      body.dob ?? null,
      body.gender ?? null,
      body.baptismDate ?? null,
      body.baptismType ?? null,
      body.joinDate ?? null,
      body.prevChurchId ?? null,
      body.phone ?? null,
      body.email ?? null,
      body.address ?? null,
      body.maritalStatus ?? null
    )
    .first<{ id: number }>();

  if (!result) {
    return json({ error: "Failed to create member" }, 500);
  }

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "create",
    entity_type: "member",
    entity_id: result.id,
    prev_state: null,
    new_state: JSON.stringify({ ...body, id: result.id }),
    module: "members",
    device_info: getDeviceInfo(request),
  });

  return json({ id: result.id, ...body }, 201);
}

export async function handleUpdateMember(
  request: Request,
  env: Env,
  memberId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["members:write"]!);
  if (forbidden) return forbidden;

  let body: {
    fullName?: string;
    preferredName?: string;
    dob?: string;
    gender?: string;
    baptismDate?: string;
    baptismType?: string;
    joinDate?: string;
    phone?: string;
    email?: string;
    address?: string;
    maritalStatus?: string;
    householdId?: number | null;
    churchId?: number;
    version: number;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (body.version === undefined) {
    return json({ error: "version is required for optimistic locking" }, 400);
  }

  if (body.baptismType) {
    const err = validateEnum(body.baptismType, BAPTISM_TYPES, "baptismType");
    if (err) return json({ error: err }, 400);
  }

  const existing = await env.DB.prepare(
    `SELECT church_id, household_id, full_name, preferred_name, dob, gender,
     baptism_date, baptism_type, join_date, phone, email, address, marital_status, status, version
     FROM members WHERE id = ?`
  )
    .bind(memberId)
    .first<Record<string, unknown>>();
  if (!existing) {
    return json({ error: "Member not found" }, 404);
  }
  if ((existing.version as number) !== body.version) {
    return json({ error: "Conflict: member has been modified. Refresh and try again." }, 409);
  }

  const prevState = JSON.stringify(existing);

  const updates: string[] = [];
  const params: unknown[] = [];

  if (body.fullName !== undefined) {
    updates.push("full_name = ?");
    params.push(body.fullName);
  }
  if (body.preferredName !== undefined) {
    updates.push("preferred_name = ?");
    params.push(body.preferredName);
  }
  if (body.dob !== undefined) {
    updates.push("dob = ?");
    params.push(body.dob);
  }
  if (body.gender !== undefined) {
    updates.push("gender = ?");
    params.push(body.gender);
  }
  if (body.baptismDate !== undefined) {
    updates.push("baptism_date = ?");
    params.push(body.baptismDate);
  }
  if (body.baptismType !== undefined) {
    updates.push("baptism_type = ?");
    params.push(body.baptismType);
  }
  if (body.joinDate !== undefined) {
    updates.push("join_date = ?");
    params.push(body.joinDate);
  }
  if (body.phone !== undefined) {
    updates.push("phone = ?");
    params.push(body.phone);
  }
  if (body.email !== undefined) {
    updates.push("email = ?");
    params.push(body.email);
  }
  if (body.address !== undefined) {
    updates.push("address = ?");
    params.push(body.address);
  }
  if (body.maritalStatus !== undefined) {
    updates.push("marital_status = ?");
    params.push(body.maritalStatus);
  }
  if (body.householdId !== undefined) {
    updates.push("household_id = ?");
    params.push(body.householdId);
  }
  if (body.churchId !== undefined) {
    updates.push("church_id = ?");
    params.push(body.churchId);
  }

  if (updates.length === 0) {
    return json({ error: "No fields to update" }, 400);
  }

  updates.push("version = version + 1");
  updates.push("updated_at = datetime('now')");
  params.push(memberId);

  await env.DB.prepare(`UPDATE members SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...params)
    .run();

  const updated = await env.DB.prepare("SELECT * FROM members WHERE id = ?").bind(memberId).first();

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "update",
    entity_type: "member",
    entity_id: memberId,
    prev_state: prevState,
    new_state: JSON.stringify(updated),
    module: "members",
    device_info: getDeviceInfo(request),
  });

  return json({ member: updated });
}

export async function handleRemoveMember(
  request: Request,
  env: Env,
  memberId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["members:write"]!);
  if (forbidden) return forbidden;

  let body: { reason: string; date?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.reason) {
    return json({ error: "reason is required" }, 400);
  }

  const err = validateEnum(body.reason, REMOVAL_REASONS, "reason");
  if (err) return json({ error: err }, 400);

  const newStatus = body.reason === "deceased" ? "deceased" : "removed";
  const statusDate = body.date || new Date().toISOString();

  const prevMember = await env.DB.prepare("SELECT * FROM members WHERE id = ?")
    .bind(memberId)
    .first();
  const prevState = prevMember ? JSON.stringify(prevMember) : null;

  await env.DB.prepare(
    `UPDATE members SET status = ?, status_date = ?, updated_at = datetime('now'), version = version + 1
     WHERE id = ?`
  )
    .bind(newStatus, statusDate, memberId)
    .run();

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "remove",
    entity_type: "member",
    entity_id: memberId,
    prev_state: prevState,
    new_state: JSON.stringify({ status: newStatus, statusDate, reason: body.reason }),
    module: "members",
    device_info: getDeviceInfo(request),
  });

  return json({ success: true, status: newStatus, statusDate });
}

// ── Households ──

export async function handleGetHouseholds(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["members:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const churchId = url.searchParams.get("church_id");

  let query = `SELECT h.*, m.full_name as head_member_name,
    (SELECT COUNT(*) FROM members WHERE household_id = h.id) as member_count
    FROM households h
    LEFT JOIN members m ON h.head_member_id = m.id`;
  const params: number[] = [];

  if (churchId) {
    query += " WHERE h.church_id = ?";
    params.push(Number(churchId));
  }
  query += " ORDER BY h.name";

  const result = await env.DB.prepare(query)
    .bind(...params)
    .all();

  return json({ households: result.results });
}

export async function handleCreateHousehold(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["members:write"]!);
  if (forbidden) return forbidden;

  let body: { churchId: number; name: string; address?: string; headMemberId?: number };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.churchId || !body.name) {
    return json({ error: "churchId and name are required" }, 400);
  }

  const result = await env.DB.prepare(
    `INSERT INTO households (church_id, name, address, head_member_id) VALUES (?, ?, ?, ?) RETURNING id`
  )
    .bind(body.churchId, body.name, body.address ?? null, body.headMemberId ?? null)
    .first<{ id: number }>();

  if (!result) {
    return json({ error: "Failed to create household" }, 500);
  }

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "create",
    entity_type: "household",
    entity_id: result.id,
    prev_state: null,
    new_state: JSON.stringify({ ...body, id: result.id }),
    module: "members",
    device_info: getDeviceInfo(request),
  });

  return json({ id: result.id, ...body }, 201);
}

export async function handleUpdateHousehold(
  request: Request,
  env: Env,
  householdId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["members:write"]!);
  if (forbidden) return forbidden;

  let body: { name?: string; address?: string; headMemberId?: number | null };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const existing = await env.DB.prepare("SELECT * FROM households WHERE id = ?")
    .bind(householdId)
    .first();
  if (!existing) {
    return json({ error: "Household not found" }, 404);
  }

  const prevState = JSON.stringify(existing);

  const updates: string[] = [];
  const params: unknown[] = [];

  if (body.name !== undefined) {
    updates.push("name = ?");
    params.push(body.name);
  }
  if (body.address !== undefined) {
    updates.push("address = ?");
    params.push(body.address);
  }
  if (body.headMemberId !== undefined) {
    updates.push("head_member_id = ?");
    params.push(body.headMemberId);
  }

  if (updates.length > 0) {
    params.push(householdId);
    await env.DB.prepare(`UPDATE households SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...params)
      .run();

    await logAudit(env, {
      actor_id: Number(auth.userId),
      action: "update",
      entity_type: "household",
      entity_id: householdId,
      prev_state: prevState,
      new_state: JSON.stringify(body),
      module: "members",
      device_info: getDeviceInfo(request),
    });
  }

  return json({ success: true });
}

// ── Positions ──

export async function handleGetPositions(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["members:read"]!);
  if (forbidden) return forbidden;

  const result = await env.DB.prepare("SELECT id, name, module FROM positions ORDER BY name").all();

  return json({ positions: result.results });
}

export async function handleCreatePosition(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["members:write"]!);
  if (forbidden) return forbidden;

  let body: { name: string; module?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.name) {
    return json({ error: "name is required" }, 400);
  }

  const existing = await env.DB.prepare("SELECT id FROM positions WHERE name = ?")
    .bind(body.name)
    .first();
  if (existing) {
    return json({ error: "Position already exists" }, 409);
  }

  try {
    const ins = await env.DB.prepare("INSERT INTO positions (name, module) VALUES (?, ?)")
      .bind(body.name, body.module ?? "core")
      .run();

    if (!ins.success) {
      return json({ error: "Failed to create position" }, 500);
    }
  } catch (err: unknown) {
    const msg = String(err);
    if (msg.includes("UNIQUE") || msg.includes("constraint")) {
      return json({ error: "Position already exists" }, 409);
    }
    return json({ error: "Failed to create position" }, 500);
  }

  const result = await env.DB.prepare("SELECT last_insert_rowid() as id").first<{ id: number }>();
  if (!result) {
    return json({ error: "Failed to create position" }, 500);
  }

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "create",
    entity_type: "position",
    entity_id: result.id,
    prev_state: null,
    new_state: JSON.stringify({ name: body.name, module: body.module ?? "core" }),
    module: "members",
    device_info: getDeviceInfo(request),
  });

  return json({ id: result.id, name: body.name, module: body.module ?? "core" }, 201);
}

export async function handleAssignPosition(
  request: Request,
  env: Env,
  memberId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["members:write"]!);
  if (forbidden) return forbidden;

  let body: { positionId: number; startDate?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.positionId) {
    return json({ error: "positionId is required" }, 400);
  }

  const member = await env.DB.prepare("SELECT id FROM members WHERE id = ?").bind(memberId).first();
  if (!member) {
    return json({ error: "Member not found" }, 404);
  }

  const position = await env.DB.prepare("SELECT id FROM positions WHERE id = ?")
    .bind(body.positionId)
    .first();
  if (!position) {
    return json({ error: "Position not found" }, 404);
  }

  const existing = await env.DB.prepare(
    "SELECT member_id FROM member_positions WHERE member_id = ? AND position_id = ? AND end_date IS NULL"
  )
    .bind(memberId, body.positionId)
    .first();
  if (existing) {
    return json({ error: "Member already holds this position" }, 409);
  }

  await env.DB.prepare(
    `INSERT INTO member_positions (member_id, position_id, start_date)
     VALUES (?, ?, ?)`
  )
    .bind(memberId, body.positionId, body.startDate ?? new Date().toISOString())
    .run();

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "assign",
    entity_type: "member_position",
    entity_id: memberId,
    prev_state: null,
    new_state: JSON.stringify({ memberId, positionId: body.positionId }),
    module: "members",
    device_info: getDeviceInfo(request),
  });

  return json({ success: true }, 201);
}

export async function handleRemovePosition(
  request: Request,
  env: Env,
  memberId: number,
  positionId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["members:write"]!);
  if (forbidden) return forbidden;

  const existing = await env.DB.prepare(
    "SELECT member_id FROM member_positions WHERE member_id = ? AND position_id = ? AND end_date IS NULL"
  )
    .bind(memberId, positionId)
    .first();
  if (!existing) {
    return json({ error: "Member does not hold this position" }, 404);
  }

  await env.DB.prepare(
    `UPDATE member_positions SET end_date = datetime('now')
     WHERE member_id = ? AND position_id = ? AND end_date IS NULL`
  )
    .bind(memberId, positionId)
    .run();

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "remove",
    entity_type: "member_position",
    entity_id: memberId,
    prev_state: JSON.stringify({ memberId, positionId }),
    new_state: JSON.stringify({ endDate: new Date().toISOString() }),
    module: "members",
    device_info: getDeviceInfo(request),
  });

  return json({ success: true });
}

// ── Transfers ──

export async function handleGetTransfers(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["members:read"]!);
  if (forbidden) return forbidden;

  // Auto-expire stale transfers (on-read check)
  try {
    const expiredMembers = await env.DB.prepare(
      `SELECT member_id FROM transfer_requests
       WHERE status IN ('pending_conference', 'pending_destination')
       AND expires_at IS NOT NULL AND expires_at < datetime('now')`
    ).all<{ member_id: number }>();

    if (expiredMembers.results.length > 0) {
      await env.DB.prepare(
        `UPDATE transfer_requests SET status = 'expired'
         WHERE status IN ('pending_conference', 'pending_destination')
         AND expires_at IS NOT NULL AND expires_at < datetime('now')`
      ).run();

      for (const row of expiredMembers.results) {
        await env.DB.prepare(
          `UPDATE members SET status = 'active', status_date = NULL,
           updated_at = datetime('now'), version = version + 1
           WHERE id = ? AND status = 'transferred'`
        )
          .bind(row.member_id)
          .run();

        await logAudit(env, {
          actor_id: 0,
          action: "auto_expire",
          entity_type: "transfer",
          entity_id: row.member_id,
          prev_state: JSON.stringify({ memberStatus: "transferred" }),
          new_state: JSON.stringify({ memberStatus: "active", reason: "transfer_expired" }),
          module: "members",
          device_info: "system",
        });
      }
    }
  } catch {
    // Table may not have expires_at column yet — safe to ignore
  }

  const url = new URL(request.url);
  const churchId = url.searchParams.get("church_id");
  const status = url.searchParams.get("status");

  let query = `SELECT tr.*,
    m.full_name as member_name,
    fc.name as from_church_name,
    tc.name as to_church_name
    FROM transfer_requests tr
    JOIN members m ON tr.member_id = m.id
    JOIN churches fc ON tr.from_church_id = fc.id
    JOIN churches tc ON tr.to_church_id = tc.id
    WHERE 1=1`;
  const params: (string | number)[] = [];

  if (churchId) {
    query += " AND (tr.from_church_id = ? OR tr.to_church_id = ?)";
    params.push(Number(churchId), Number(churchId));
  }
  if (status) {
    query += " AND tr.status = ?";
    params.push(status);
  }
  query += " ORDER BY tr.initiated_at DESC";

  const result = await env.DB.prepare(query)
    .bind(...params)
    .all();

  return json({ transfers: result.results });
}

export async function handleInitiateTransfer(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["members:write"]!);
  if (forbidden) return forbidden;

  let body: { memberId: number; toChurchId: number };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.memberId || !body.toChurchId) {
    return json({ error: "memberId and toChurchId are required" }, 400);
  }

  const member = await env.DB.prepare("SELECT id, church_id, status FROM members WHERE id = ?")
    .bind(body.memberId)
    .first<{ id: number; church_id: number; status: string }>();
  if (!member) {
    return json({ error: "Member not found" }, 404);
  }
  if (member.status !== "active") {
    return json({ error: "Only active members can be transferred" }, 400);
  }

  const toChurch = await env.DB.prepare("SELECT id FROM churches WHERE id = ?")
    .bind(body.toChurchId)
    .first();
  if (!toChurch) {
    return json({ error: "Destination church not found" }, 404);
  }
  if (member.church_id === body.toChurchId) {
    return json({ error: "Cannot transfer to the same church" }, 400);
  }

  const existing = await env.DB.prepare(
    `SELECT id FROM transfer_requests
     WHERE member_id = ? AND status IN ('pending_conference', 'pending_destination')`
  )
    .bind(body.memberId)
    .first();
  if (existing) {
    return json({ error: "A pending transfer already exists for this member" }, 409);
  }

  const result = await env.DB.prepare(
    `INSERT INTO transfer_requests (member_id, from_church_id, to_church_id, initiated_by, expires_at)
     VALUES (?, ?, ?, ?, datetime('now', '+6 months')) RETURNING id`
  )
    .bind(body.memberId, member.church_id, body.toChurchId, Number(auth.userId))
    .first<{ id: number }>();

  if (!result) {
    return json({ error: "Failed to initiate transfer" }, 500);
  }

  await env.DB.prepare(
    `UPDATE members SET status = 'transferred', status_date = datetime('now'),
     updated_at = datetime('now'), version = version + 1 WHERE id = ?`
  )
    .bind(body.memberId)
    .run();

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "initiate",
    entity_type: "transfer",
    entity_id: result.id,
    prev_state: null,
    new_state: JSON.stringify({
      memberId: body.memberId,
      fromChurchId: member.church_id,
      toChurchId: body.toChurchId,
    }),
    module: "members",
    device_info: getDeviceInfo(request),
  });

  const fromChurch = await env.DB.prepare("SELECT name FROM churches WHERE id = ?")
    .bind(member.church_id)
    .first<{ name: string }>();
  const toChurchName = await env.DB.prepare("SELECT name FROM churches WHERE id = ?")
    .bind(body.toChurchId)
    .first<{ name: string }>();

  const memberName = await env.DB.prepare("SELECT full_name FROM members WHERE id = ?")
    .bind(body.memberId)
    .first<{ full_name: string }>();

  const confUsers = await env.DB.prepare(
    `SELECT u.id FROM users u
     JOIN churches c ON c.parent_id = u.conference_id AND c.parent_type = 'conference'
     WHERE c.id = ? AND u.role IN ('secretary', 'president')`
  )
    .bind(member.church_id)
    .all<{ id: number }>();

  for (const u of confUsers.results) {
    await createNotification(
      env,
      u.id,
      "transfer_initiated",
      "transfer",
      result.id,
      `Transfer requested: ${memberName?.full_name ?? "Member"} from ${fromChurch?.name ?? "source"} to ${toChurchName?.name ?? "destination"}`
    );
  }

  return json({ id: result.id, memberId: body.memberId, status: "pending_conference" }, 201);
}

export async function handleApproveTransfer(
  request: Request,
  env: Env,
  transferId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["members:write"]!);
  if (forbidden) return forbidden;

  const transfer = await env.DB.prepare("SELECT id, status FROM transfer_requests WHERE id = ?")
    .bind(transferId)
    .first<{ id: number; status: string }>();
  if (!transfer) {
    return json({ error: "Transfer not found" }, 404);
  }
  if (transfer.status !== "pending_conference") {
    return json({ error: "Transfer cannot be approved in its current state" }, 400);
  }

  await env.DB.prepare(
    `UPDATE transfer_requests SET status = 'pending_destination',
     conference_approved_by = ?, conference_approved_at = datetime('now')
     WHERE id = ?`
  )
    .bind(Number(auth.userId), transferId)
    .run();

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "approve",
    entity_type: "transfer",
    entity_id: transferId,
    prev_state: JSON.stringify({ status: "pending_conference" }),
    new_state: JSON.stringify({ status: "pending_destination" }),
    module: "members",
    device_info: getDeviceInfo(request),
  });

  const tr = await env.DB.prepare(
    `SELECT tr.member_id, tr.to_church_id, m.full_name, fc.name as from_church, tc.name as to_church
     FROM transfer_requests tr
     JOIN members m ON tr.member_id = m.id
     JOIN churches fc ON tr.from_church_id = fc.id
     JOIN churches tc ON tr.to_church_id = tc.id
     WHERE tr.id = ?`
  )
    .bind(transferId)
    .first<{
      member_id: number;
      to_church_id: number;
      full_name: string;
      from_church: string;
      to_church: string;
    }>();

  if (tr) {
    const destUsers = await env.DB.prepare(
      `SELECT u.id FROM users u
       JOIN members m ON u.member_id = m.id AND m.church_id = ?
       WHERE u.role IN ('secretary', 'pastor')`
    )
      .bind(tr.to_church_id)
      .all<{ id: number }>();

    for (const u of destUsers.results) {
      await createNotification(
        env,
        u.id,
        "transfer_approved",
        "transfer",
        transferId,
        `Incoming transfer: ${tr.full_name} from ${tr.from_church} to ${tr.to_church}`
      );
    }
  }

  return json({ success: true, status: "pending_destination" });
}

export async function handleAcceptTransfer(
  request: Request,
  env: Env,
  transferId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["members:write"]!);
  if (forbidden) return forbidden;

  const transfer = await env.DB.prepare(
    "SELECT id, member_id, to_church_id, status FROM transfer_requests WHERE id = ?"
  )
    .bind(transferId)
    .first<{ id: number; member_id: number; to_church_id: number; status: string }>();
  if (!transfer) {
    return json({ error: "Transfer not found" }, 404);
  }
  if (transfer.status !== "pending_destination") {
    return json({ error: "Transfer cannot be accepted in its current state" }, 400);
  }

  await env.DB.prepare(
    `UPDATE transfer_requests SET status = 'completed',
     accepted_by = ?, accepted_at = datetime('now')
     WHERE id = ?`
  )
    .bind(Number(auth.userId), transferId)
    .run();

  await env.DB.prepare(
    `UPDATE members SET church_id = ?, prev_church_id = (SELECT from_church_id FROM transfer_requests WHERE id = ?),
     status = 'active', status_date = NULL, updated_at = datetime('now'), version = version + 1
     WHERE id = ?`
  )
    .bind(transfer.to_church_id, transferId, transfer.member_id)
    .run();

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "accept",
    entity_type: "transfer",
    entity_id: transferId,
    prev_state: JSON.stringify({ status: "pending_destination" }),
    new_state: JSON.stringify({ status: "completed", newChurchId: transfer.to_church_id }),
    module: "members",
    device_info: getDeviceInfo(request),
  });

  const tr = await env.DB.prepare(
    `SELECT tr.member_id, tr.from_church_id, m.full_name
     FROM transfer_requests tr
     JOIN members m ON tr.member_id = m.id
     WHERE tr.id = ?`
  )
    .bind(transferId)
    .first<{ member_id: number; from_church_id: number; full_name: string }>();

  if (tr) {
    const srcUsers = await env.DB.prepare(
      `SELECT u.id FROM users u
       JOIN members m ON u.member_id = m.id AND m.church_id = ?
       WHERE u.role IN ('secretary', 'pastor')`
    )
      .bind(tr.from_church_id)
      .all<{ id: number }>();

    for (const u of srcUsers.results) {
      await createNotification(
        env,
        u.id,
        "transfer_completed",
        "transfer",
        transferId,
        `Transfer completed: ${tr.full_name} has been received`
      );
    }
  }

  return json({ success: true, status: "completed" });
}

export async function handleRejectTransfer(
  request: Request,
  env: Env,
  transferId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["members:write"]!);
  if (forbidden) return forbidden;

  let body: { note?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Body is optional for reject
  }

  const transfer = await env.DB.prepare(
    "SELECT id, member_id, from_church_id, status FROM transfer_requests WHERE id = ?"
  )
    .bind(transferId)
    .first<{
      id: number;
      member_id: number;
      from_church_id: number;
      status: string;
    }>();
  if (!transfer) {
    return json({ error: "Transfer not found" }, 404);
  }
  if (!["pending_conference", "pending_destination"].includes(transfer.status)) {
    return json({ error: "Transfer cannot be rejected in its current state" }, 400);
  }

  const note = body.note ?? null;
  await env.DB.prepare(
    "UPDATE transfer_requests SET status = 'rejected', rejection_note = ? WHERE id = ?"
  )
    .bind(note, transferId)
    .run();

  await env.DB.prepare(
    `UPDATE members SET status = 'active', status_date = NULL,
     updated_at = datetime('now'), version = version + 1 WHERE id = ?`
  )
    .bind(transfer.member_id)
    .run();

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "reject",
    entity_type: "transfer",
    entity_id: transferId,
    prev_state: JSON.stringify({ status: transfer.status }),
    new_state: JSON.stringify({ status: "rejected", note }),
    module: "members",
    device_info: getDeviceInfo(request),
  });

  const tr = await env.DB.prepare(
    `SELECT m.full_name FROM transfer_requests tr
     JOIN members m ON tr.member_id = m.id
     WHERE tr.id = ?`
  )
    .bind(transferId)
    .first<{ full_name: string }>();

  // Notify the initiator's church clerk
  const srcUsers = await env.DB.prepare(
    `SELECT u.id FROM users u
     JOIN members m ON u.member_id = m.id AND m.church_id = ?
     WHERE u.role IN ('secretary', 'pastor')`
  )
    .bind(transfer.from_church_id)
    .all<{ id: number }>();

  for (const u of srcUsers.results) {
    await createNotification(
      env,
      u.id,
      "transfer_rejected",
      "transfer",
      transferId,
      `Transfer rejected for ${tr?.full_name ?? "member"}${note ? `: ${note}` : ""}`
    );
  }

  return json({ success: true, status: "rejected" });
}

export async function handleOverrideTransfer(
  request: Request,
  env: Env,
  transferId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const user = await env.DB.prepare("SELECT role, conference_id FROM users WHERE id = ?")
    .bind(Number(auth.userId))
    .first<{ role: string; conference_id: number | null }>();
  if (!user || !["secretary", "president"].includes(user.role)) {
    return json({ error: "Only Conference Secretary or President can override transfers" }, 403);
  }

  let body: { action: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!["force_approve", "force_reject"].includes(body.action)) {
    return json({ error: "action must be force_approve or force_reject" }, 400);
  }

  const transfer = await env.DB.prepare(
    "SELECT id, member_id, from_church_id, to_church_id, status FROM transfer_requests WHERE id = ?"
  )
    .bind(transferId)
    .first<{
      id: number;
      member_id: number;
      from_church_id: number;
      to_church_id: number;
      status: string;
    }>();
  if (!transfer) {
    return json({ error: "Transfer not found" }, 404);
  }
  if (!["pending_conference", "pending_destination"].includes(transfer.status)) {
    return json({ error: "Transfer cannot be overridden in its current state" }, 400);
  }

  if (body.action === "force_approve") {
    if (transfer.status === "pending_conference") {
      await env.DB.prepare(
        `UPDATE transfer_requests SET status = 'pending_destination', override_by = ?, override_at = datetime('now'),
         override_action = 'force_approve', override_note = ?,
         conference_approved_by = ?, conference_approved_at = datetime('now')
         WHERE id = ?`
      )
        .bind(Number(auth.userId), body.note ?? null, Number(auth.userId), transferId)
        .run();
    } else {
      await env.DB.prepare(
        `UPDATE transfer_requests SET status = 'completed', override_by = ?, override_at = datetime('now'),
         override_action = 'force_approve', override_note = ?,
         accepted_by = ?, accepted_at = datetime('now')
         WHERE id = ?`
      )
        .bind(Number(auth.userId), body.note ?? null, Number(auth.userId), transferId)
        .run();

      await env.DB.prepare(
        `UPDATE members SET church_id = ?, status = 'active', status_date = NULL,
         updated_at = datetime('now'), version = version + 1 WHERE id = ?`
      )
        .bind(transfer.to_church_id, transfer.member_id)
        .run();
    }
  } else {
    await env.DB.prepare(
      `UPDATE transfer_requests SET status = 'rejected', override_by = ?, override_at = datetime('now'),
       override_action = 'force_reject', override_note = ? WHERE id = ?`
    )
      .bind(Number(auth.userId), body.note ?? null, transferId)
      .run();

    await env.DB.prepare(
      `UPDATE members SET status = 'active', status_date = NULL,
       updated_at = datetime('now'), version = version + 1 WHERE id = ?`
    )
      .bind(transfer.member_id)
      .run();
  }

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: `override_${body.action}`,
    entity_type: "transfer",
    entity_id: transferId,
    prev_state: JSON.stringify({ status: transfer.status }),
    new_state: JSON.stringify({
      status: body.action === "force_approve" ? "approved" : "rejected",
      override: true,
      note: body.note,
    }),
    module: "members",
    device_info: getDeviceInfo(request),
  });

  const targetStatus =
    body.action === "force_approve"
      ? transfer.status === "pending_conference"
        ? "pending_destination"
        : "completed"
      : "rejected";

  return json({ success: true, status: targetStatus, overridden: true });
}

// ── Member Self-Service ──

export async function handleGetSelfMember(
  request: Request,
  env: Env,
  churchId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const user = await env.DB.prepare("SELECT id, member_id FROM users WHERE id = ?")
    .bind(Number(auth.userId))
    .first<{ id: number; member_id: number | null }>();
  if (!user || !user.member_id) {
    return json({ error: "No member record linked to your account" }, 404);
  }

  const member = await env.DB.prepare(
    `SELECT id, church_id, household_id, full_name, preferred_name, dob, gender,
     baptism_date, baptism_type, join_date, phone, email, address, marital_status,
     status, created_at, updated_at, version
     FROM members WHERE id = ? AND church_id = ?`
  )
    .bind(user.member_id, churchId)
    .first();
  if (!member) {
    return json({ error: "Member not found in this church" }, 404);
  }

  return json(member);
}

export async function handleUpdateSelfMember(
  request: Request,
  env: Env,
  churchId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const user = await env.DB.prepare("SELECT id, member_id FROM users WHERE id = ?")
    .bind(Number(auth.userId))
    .first<{ id: number; member_id: number | null }>();
  if (!user || !user.member_id) {
    return json({ error: "No member record linked to your account" }, 404);
  }

  let body: {
    fullName?: string;
    phone?: string;
    email?: string;
    address?: string;
    version: number;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (body.version === undefined) {
    return json({ error: "version is required for optimistic locking" }, 400);
  }

  const existing = await env.DB.prepare(
    "SELECT id, version FROM members WHERE id = ? AND church_id = ?"
  )
    .bind(user.member_id, churchId)
    .first<{ id: number; version: number }>();
  if (!existing) {
    return json({ error: "Member not found in this church" }, 404);
  }
  if (existing.version !== body.version) {
    return json({ error: "Conflict: member has been modified. Refresh and try again." }, 409);
  }

  const updates: string[] = [];
  const params: (string | number)[] = [];

  if (body.fullName !== undefined) {
    updates.push("full_name = ?");
    params.push(body.fullName);
  }
  if (body.phone !== undefined) {
    updates.push("phone = ?");
    params.push(body.phone);
  }
  if (body.email !== undefined) {
    updates.push("email = ?");
    params.push(body.email);
  }
  if (body.address !== undefined) {
    updates.push("address = ?");
    params.push(body.address);
  }

  if (updates.length === 0) {
    return json({ message: "No fields to update" });
  }

  updates.push("version = version + 1");
  updates.push("updated_at = datetime('now')");
  params.push(user.member_id);

  await env.DB.prepare(`UPDATE members SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...params)
    .run();

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "update",
    entity_type: "member",
    entity_id: user.member_id,
    prev_state: JSON.stringify(existing),
    new_state: JSON.stringify(body),
    module: "members",
    device_info: getDeviceInfo(request),
  });

  return json({ success: true });
}

// ── Member Giving Declarations ──

export async function handleMemberGiving(
  request: Request,
  env: Env,
  churchId: number,
  memberId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  let body: {
    fundId: number;
    amount: number;
    description?: string;
    proxyForMemberId?: number;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.fundId || !body.amount) {
    return json({ error: "fundId and amount are required" }, 400);
  }
  if (body.amount <= 0) {
    return json({ error: "amount must be positive" }, 400);
  }

  const member = await env.DB.prepare(
    "SELECT id, church_id, status, full_name FROM members WHERE id = ?"
  )
    .bind(memberId)
    .first<{ id: number; church_id: number; status: string; full_name: string }>();
  if (!member) {
    return json({ error: "Member not found" }, 404);
  }
  if (member.church_id !== churchId) {
    return json({ error: "Member does not belong to this church" }, 403);
  }

  if (body.proxyForMemberId) {
    if (body.proxyForMemberId === memberId) {
      return json({ error: "Cannot proxy for yourself — omit proxyForMemberId" }, 400);
    }
    const targetMember = await env.DB.prepare("SELECT id, church_id FROM members WHERE id = ?")
      .bind(body.proxyForMemberId)
      .first<{ id: number; church_id: number }>();
    if (!targetMember) {
      return json({ error: "Proxy target member not found" }, 404);
    }
    if (targetMember.church_id !== churchId) {
      return json({ error: "Proxy target must be in the same church" }, 403);
    }
  }

  const fund = await env.DB.prepare(
    "SELECT id, name, type, forwarding_rule FROM funds WHERE id = ?"
  )
    .bind(body.fundId)
    .first<{ id: number; name: string; type: string; forwarding_rule: string }>();
  if (!fund) {
    return json({ error: "Fund not found" }, 404);
  }

  const uuid = crypto.randomUUID();
  const effectiveMemberId = body.proxyForMemberId ?? memberId;
  const result = await env.DB.prepare(
    `INSERT INTO transactions
     (church_id, fund_id, type, amount, description, created_by, uuid, member_id, proxy_for_member_id, verified)
     VALUES (?, ?, 'income', ?, ?, ?, ?, ?, ?, 0)
     RETURNING id`
  )
    .bind(
      churchId,
      body.fundId,
      body.amount,
      body.description ?? null,
      Number(auth.userId),
      uuid,
      effectiveMemberId,
      body.proxyForMemberId ? memberId : null
    )
    .first<{ id: number }>();
  if (!result) {
    return json({ error: "Failed to record giving declaration" }, 500);
  }

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "declare",
    entity_type: "transaction",
    entity_id: result.id,
    prev_state: null,
    new_state: JSON.stringify({
      ...body,
      churchId,
      memberId: effectiveMemberId,
      verified: false,
    }),
    module: "finance",
    device_info: getDeviceInfo(request),
  });

  return json(
    {
      id: result.id,
      memberId: effectiveMemberId,
      amount: body.amount,
      fundType: fund.type,
      verified: false,
      proxyFor: body.proxyForMemberId ? memberId : null,
    },
    201
  );
}

// ── Member-Initiated Transfer ──

export async function handleMemberTransfer(
  request: Request,
  env: Env,
  churchId: number,
  memberId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const user = await env.DB.prepare("SELECT id, member_id FROM users WHERE id = ?")
    .bind(Number(auth.userId))
    .first<{ id: number; member_id: number | null }>();
  if (!user || !user.member_id) {
    return json({ error: "No member record linked to your account" }, 404);
  }

  let body: { toChurchId: number };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.toChurchId) {
    return json({ error: "toChurchId is required" }, 400);
  }

  const member = await env.DB.prepare(
    "SELECT id, church_id, status, full_name FROM members WHERE id = ?"
  )
    .bind(memberId)
    .first<{ id: number; church_id: number; status: string; full_name: string }>();
  if (!member) {
    return json({ error: "Member not found" }, 404);
  }
  if (member.church_id !== churchId) {
    return json({ error: "Member does not belong to this church" }, 403);
  }
  if (member.status !== "active") {
    return json({ error: "Only active members can be transferred" }, 400);
  }

  const toChurch = await env.DB.prepare("SELECT id FROM churches WHERE id = ?")
    .bind(body.toChurchId)
    .first();
  if (!toChurch) {
    return json({ error: "Destination church not found" }, 404);
  }
  if (member.church_id === body.toChurchId) {
    return json({ error: "Cannot transfer to the same church" }, 400);
  }

  const existing = await env.DB.prepare(
    `SELECT id FROM transfer_requests
     WHERE member_id = ? AND status IN ('pending_conference', 'pending_destination')`
  )
    .bind(memberId)
    .first();
  if (existing) {
    return json({ error: "A pending transfer already exists for this member" }, 409);
  }

  const result = await env.DB.prepare(
    `INSERT INTO transfer_requests (member_id, from_church_id, to_church_id, initiated_by, expires_at)
     VALUES (?, ?, ?, ?, datetime('now', '+6 months')) RETURNING id`
  )
    .bind(memberId, member.church_id, body.toChurchId, Number(auth.userId))
    .first<{ id: number }>();
  if (!result) {
    return json({ error: "Failed to initiate transfer" }, 500);
  }

  await env.DB.prepare(
    `UPDATE members SET status = 'transferred', status_date = datetime('now'),
     updated_at = datetime('now'), version = version + 1 WHERE id = ?`
  )
    .bind(memberId)
    .run();

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "transfer_request",
    entity_type: "transfer",
    entity_id: result.id,
    prev_state: null,
    new_state: JSON.stringify({
      memberId,
      fromChurchId: member.church_id,
      toChurchId: body.toChurchId,
      source: "member",
    }),
    module: "members",
    device_info: getDeviceInfo(request),
  });

  const fromChurch = await env.DB.prepare("SELECT name FROM churches WHERE id = ?")
    .bind(member.church_id)
    .first<{ name: string }>();
  const toChurchName = await env.DB.prepare("SELECT name FROM churches WHERE id = ?")
    .bind(body.toChurchId)
    .first<{ name: string }>();

  const confUsers = await env.DB.prepare(
    `SELECT u.id FROM users u
     JOIN churches c ON c.parent_id = u.conference_id AND c.parent_type = 'conference'
     WHERE c.id = ? AND u.role IN ('secretary', 'president')`
  )
    .bind(member.church_id)
    .all<{ id: number }>();

  for (const u of confUsers.results) {
    await createNotification(
      env,
      u.id,
      "transfer_initiated",
      "transfer",
      result.id,
      `Transfer requested: ${member.full_name} from ${fromChurch?.name ?? "source"} to ${toChurchName?.name ?? "destination"}`
    );
  }

  return json({ id: result.id, memberId, status: "pending_conference" }, 201);
}

// ── Treasurer Declaration Verification ──

export async function handleListDeclarations(
  request: Request,
  env: Env,
  churchId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const verifiedParam = url.searchParams.get("verified");

  let query = `SELECT t.id, t.church_id, t.fund_id, t.amount, t.description, t.member_id,
    t.proxy_for_member_id, t.verified, t.verified_by, t.verified_at, t.created_at,
    t.uuid, m.full_name as member_name, m2.full_name as proxy_for_name,
    f.name as fund_name, f.type as fund_type
    FROM transactions t
    JOIN members m ON t.member_id = m.id
    LEFT JOIN members m2 ON t.proxy_for_member_id = m2.id
    JOIN funds f ON t.fund_id = f.id
    WHERE t.church_id = ? AND t.batch_id IS NULL`;
  const params: (string | number)[] = [churchId];

  if (verifiedParam === "false") {
    query += " AND t.verified = 0";
  } else if (verifiedParam === "true") {
    query += " AND t.verified = 1";
  }
  query += " ORDER BY t.created_at DESC";

  const result = await env.DB.prepare(query)
    .bind(...params)
    .all();

  return json({ declarations: result.results });
}

export async function handleVerifyDeclaration(
  request: Request,
  env: Env,
  churchId: number,
  declarationId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:write"]!);
  if (forbidden) return forbidden;

  const declaration = await env.DB.prepare(
    `SELECT id, church_id, verified FROM transactions
     WHERE id = ? AND batch_id IS NULL`
  )
    .bind(declarationId)
    .first<{ id: number; church_id: number; verified: number }>();
  if (!declaration) {
    return json({ error: "Declaration not found" }, 404);
  }
  if (declaration.church_id !== churchId) {
    return json({ error: "Declaration does not belong to this church" }, 403);
  }
  if (declaration.verified === 1) {
    return json({ error: "Declaration is already verified" }, 400);
  }

  await env.DB.prepare(
    `UPDATE transactions SET verified = 1, verified_by = ?, verified_at = datetime('now')
     WHERE id = ?`
  )
    .bind(Number(auth.userId), declarationId)
    .run();

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "verify",
    entity_type: "transaction",
    entity_id: declarationId,
    prev_state: JSON.stringify({ verified: false }),
    new_state: JSON.stringify({ verified: true }),
    module: "finance",
    device_info: getDeviceInfo(request),
  });

  return json({ success: true, id: declarationId, verified: true });
}

export async function handleRejectDeclaration(
  request: Request,
  env: Env,
  churchId: number,
  declarationId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:write"]!);
  if (forbidden) return forbidden;

  const declaration = await env.DB.prepare(
    `SELECT id, church_id, verified FROM transactions
     WHERE id = ? AND batch_id IS NULL`
  )
    .bind(declarationId)
    .first<{ id: number; church_id: number; verified: number }>();
  if (!declaration) {
    return json({ error: "Declaration not found" }, 404);
  }
  if (declaration.church_id !== churchId) {
    return json({ error: "Declaration does not belong to this church" }, 403);
  }
  if (declaration.verified === 1) {
    return json({ error: "Declaration is already verified — cannot reject" }, 400);
  }

  await env.DB.prepare("DELETE FROM transactions WHERE id = ?").bind(declarationId).run();

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "reject_declaration",
    entity_type: "transaction",
    entity_id: declarationId,
    prev_state: JSON.stringify({ verified: false }),
    new_state: JSON.stringify({ rejected: true, deleted: true }),
    module: "finance",
    device_info: getDeviceInfo(request),
  });

  return json({ success: true, id: declarationId, rejected: true });
}
