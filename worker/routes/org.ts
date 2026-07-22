import { authenticate, authorize, requireConference } from "../lib/middleware";
import { PERMISSIONS } from "../lib/roles";
import { parseCsv, validateCsvHeaders } from "../lib/csv";
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

export async function handleGetConferences(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["org:read"]!);
  if (forbidden) return forbidden;

  const conferences = await env.DB.prepare(
    "SELECT id, name, code, address, bank_details, created_at FROM conferences ORDER BY name"
  ).all();

  return json({ conferences: conferences.results });
}

export async function handleCreateConference(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["org:manage"]!);
  if (forbidden) return forbidden;

  let body: { name: string; code: string; address?: string; bankDetails?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.name || !body.code) {
    return json({ error: "name and code are required" }, 400);
  }

  const existing = await env.DB.prepare("SELECT id FROM conferences WHERE code = ?")
    .bind(body.code)
    .first();
  if (existing) {
    return json({ error: "Conference code already exists" }, 409);
  }

  const result = await env.DB.prepare(
    `INSERT INTO conferences (name, code, address, bank_details) VALUES (?, ?, ?, ?) RETURNING id`
  )
    .bind(body.name, body.code, body.address ?? null, body.bankDetails ?? null)
    .first<{ id: number }>();

  if (!result) {
    return json({ error: "Failed to create conference" }, 500);
  }

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "create",
    entity_type: "conference",
    entity_id: result.id,
    prev_state: null,
    new_state: JSON.stringify({ ...body, id: result.id }),
    module: "org",
    device_info: getDeviceInfo(request),
  });

  return json({ id: result.id, ...body }, 201);
}

export async function handleUpdateConference(
  request: Request,
  env: Env,
  conferenceId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["org:manage"]!);
  if (forbidden) return forbidden;

  const confCheck = requireConference(auth, conferenceId);
  if (confCheck) return confCheck;

  let body: { name?: string; code?: string; address?: string; bankDetails?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const existing = await env.DB.prepare("SELECT * FROM conferences WHERE id = ?")
    .bind(conferenceId)
    .first();
  if (!existing) {
    return json({ error: "Conference not found" }, 404);
  }

  const prevState = JSON.stringify(existing);

  const updates: string[] = [];
  const params: unknown[] = [];

  if (body.name !== undefined) {
    updates.push("name = ?");
    params.push(body.name);
  }
  if (body.code !== undefined) {
    updates.push("code = ?");
    params.push(body.code);
  }
  if (body.address !== undefined) {
    updates.push("address = ?");
    params.push(body.address);
  }
  if (body.bankDetails !== undefined) {
    updates.push("bank_details = ?");
    params.push(body.bankDetails);
  }

  if (updates.length > 0) {
    params.push(conferenceId);
    await env.DB.prepare(`UPDATE conferences SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...params)
      .run();

    await logAudit(env, {
      actor_id: Number(auth.userId),
      action: "update",
      entity_type: "conference",
      entity_id: conferenceId,
      prev_state: prevState,
      new_state: JSON.stringify(body),
      module: "org",
      device_info: getDeviceInfo(request),
    });
  }

  return json({ success: true });
}

export async function handleGetDistricts(
  _request: Request,
  env: Env,
  conferenceId: number
): Promise<Response> {
  const districts = await env.DB.prepare(
    `SELECT d.id, d.name, d.pastor_user_id, d.created_at,
            u.email as pastor_email
     FROM districts d
     LEFT JOIN users u ON d.pastor_user_id = u.id
     WHERE d.conference_id = ?
     ORDER BY d.name`
  )
    .bind(conferenceId)
    .all();

  return json({ districts: districts.results });
}

export async function handleCreateDistrict(
  request: Request,
  env: Env,
  conferenceId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["org:manage"]!);
  if (forbidden) return forbidden;

  const confCheck = requireConference(auth, conferenceId);
  if (confCheck) return confCheck;

  let body: { name: string; pastorUserId?: number };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.name) {
    return json({ error: "name is required" }, 400);
  }

  const result = await env.DB.prepare(
    `INSERT INTO districts (name, conference_id, pastor_user_id) VALUES (?, ?, ?) RETURNING id`
  )
    .bind(body.name, conferenceId, body.pastorUserId ?? null)
    .first<{ id: number }>();

  if (!result) {
    return json({ error: "Failed to create district" }, 500);
  }

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "create",
    entity_type: "district",
    entity_id: result.id,
    prev_state: null,
    new_state: JSON.stringify({ ...body, id: result.id, conferenceId }),
    module: "org",
    device_info: getDeviceInfo(request),
  });

  return json({ id: result.id, ...body, conferenceId }, 201);
}

export async function handleUpdateDistrict(
  request: Request,
  env: Env,
  districtId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["org:manage"]!);
  if (forbidden) return forbidden;

  let body: { name?: string; pastorUserId?: number | null };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const existing = await env.DB.prepare("SELECT * FROM districts WHERE id = ?")
    .bind(districtId)
    .first();
  if (!existing) {
    return json({ error: "District not found" }, 404);
  }

  const prevState = JSON.stringify(existing);

  const updates: string[] = [];
  const params: unknown[] = [];

  if (body.name !== undefined) {
    updates.push("name = ?");
    params.push(body.name);
  }
  if (body.pastorUserId !== undefined) {
    updates.push("pastor_user_id = ?");
    params.push(body.pastorUserId);
  }

  if (updates.length > 0) {
    params.push(districtId);
    await env.DB.prepare(`UPDATE districts SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...params)
      .run();

    await logAudit(env, {
      actor_id: Number(auth.userId),
      action: "update",
      entity_type: "district",
      entity_id: districtId,
      prev_state: prevState,
      new_state: JSON.stringify(body),
      module: "org",
      device_info: getDeviceInfo(request),
    });
  }

  return json({ success: true });
}

export async function handleGetChurches(
  _request: Request,
  env: Env,
  conferenceId: number
): Promise<Response> {
  const churches = await env.DB.prepare(
    `SELECT c.id, c.name, c.code, c.type, c.parent_id, c.parent_type,
            c.district_id, c.address, c.bank_details, c.charter_status, c.founded_date,
            c.created_at, d.name as district_name
     FROM churches c
     LEFT JOIN districts d ON c.district_id = d.id
     WHERE c.parent_type = 'conference' AND c.parent_id = ? OR c.id IN (
       SELECT id FROM churches WHERE parent_type = 'conference' AND parent_id = ?
     )
     ORDER BY c.name`
  )
    .bind(conferenceId, conferenceId)
    .all();

  return json({ churches: churches.results });
}

export async function handleCreateChurch(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["org:manage"]!);
  if (forbidden) return forbidden;

  let body: {
    name: string;
    code?: string;
    type: string;
    parentId: number;
    parentType: string;
    districtId?: number;
    address?: string;
    bankDetails?: string;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.name || !body.type || body.parentId === undefined || !body.parentType) {
    return json({ error: "name, type, parentId, and parentType are required" }, 400);
  }

  if (!["organized", "company", "branch"].includes(body.type)) {
    return json({ error: "type must be organized, company, or branch" }, 400);
  }

  const churchCode = body.code || body.name.toLowerCase().replace(/\s+/g, "_");

  const result = await env.DB.prepare(
    `INSERT INTO churches (name, code, type, parent_id, parent_type, district_id, address, bank_details)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
  )
    .bind(
      body.name,
      churchCode,
      body.type,
      body.parentId,
      body.parentType,
      body.districtId ?? null,
      body.address ?? null,
      body.bankDetails ?? null
    )
    .first<{ id: number }>();

  if (!result) {
    return json({ error: "Failed to create church" }, 500);
  }

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "create",
    entity_type: "church",
    entity_id: result.id,
    prev_state: null,
    new_state: JSON.stringify({ ...body, id: result.id, code: churchCode }),
    module: "org",
    device_info: getDeviceInfo(request),
  });

  return json({ id: result.id, ...body, code: churchCode }, 201);
}

export async function handleUpdateChurch(
  request: Request,
  env: Env,
  churchId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["org:manage"]!);
  if (forbidden) return forbidden;

  let body: {
    name?: string;
    code?: string;
    type?: string;
    districtId?: number | null;
    address?: string;
    bankDetails?: string;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const existing = await env.DB.prepare("SELECT * FROM churches WHERE id = ?")
    .bind(churchId)
    .first();
  if (!existing) {
    return json({ error: "Church not found" }, 404);
  }

  const prevState = JSON.stringify(existing);

  if (body.type && !["organized", "company", "branch"].includes(body.type)) {
    return json({ error: "type must be organized, company, or branch" }, 400);
  }

  const updates: string[] = [];
  const params: unknown[] = [];

  if (body.name !== undefined) {
    updates.push("name = ?");
    params.push(body.name);
  }
  if (body.code !== undefined) {
    updates.push("code = ?");
    params.push(body.code);
  }
  if (body.type !== undefined) {
    updates.push("type = ?");
    params.push(body.type);
  }
  if (body.districtId !== undefined) {
    updates.push("district_id = ?");
    params.push(body.districtId);
  }
  if (body.address !== undefined) {
    updates.push("address = ?");
    params.push(body.address);
  }
  if (body.bankDetails !== undefined) {
    updates.push("bank_details = ?");
    params.push(body.bankDetails);
  }

  if (updates.length > 0) {
    params.push(churchId);
    await env.DB.prepare(`UPDATE churches SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...params)
      .run();

    await logAudit(env, {
      actor_id: Number(auth.userId),
      action: "update",
      entity_type: "church",
      entity_id: churchId,
      prev_state: prevState,
      new_state: JSON.stringify(body),
      module: "org",
      device_info: getDeviceInfo(request),
    });
  }

  return json({ success: true });
}

export async function handleBulkCreateChurches(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["org:manage"]!);
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

  const headerError = validateCsvHeaders(rows[0]!, ["name", "type", "district"]);
  if (headerError) {
    return json({ error: headerError }, 400);
  }

  const created: { name: string; type: string; id: number }[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]!;
    const name = row[0]?.trim();
    const type = row[1]?.trim().toLowerCase();
    const districtName = row[2]?.trim();

    if (!name || !type) {
      errors.push({ row: i, message: "name and type are required" });
      continue;
    }
    if (!["organized", "company", "branch"].includes(type)) {
      errors.push({ row: i, message: `Invalid church type: ${type}` });
      continue;
    }

    let districtId: number | null = null;
    if (districtName) {
      const district = await env.DB.prepare(
        "SELECT id FROM districts WHERE name = ? AND conference_id = ?"
      )
        .bind(districtName, body.conferenceId)
        .first<{ id: number }>();
      if (!district) {
        errors.push({ row: i, message: `District not found: ${districtName}` });
        continue;
      }
      districtId = district.id;
    }

    const result = await env.DB.prepare(
      `INSERT INTO churches (name, code, type, parent_id, parent_type, district_id)
       VALUES (?, ?, ?, ?, 'conference', ?) RETURNING id`
    )
      .bind(name, name.toLowerCase().replace(/\s+/g, "_"), type, body.conferenceId, districtId)
      .first<{ id: number }>();

    if (result) {
      created.push({ name, type, id: result.id });
    } else {
      errors.push({ row: i, message: "Failed to create church" });
    }
  }

  return json({ created, errors });
}
