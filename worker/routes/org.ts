import { authenticate, authorize, requireConference } from "../lib/middleware";
import { PERMISSIONS } from "../lib/roles";
import { parseCsv, validateCsvHeaders } from "../lib/csv";
import { logAudit, getDeviceInfo } from "../lib/audit";
import { json } from "../lib/response";
import { createDb } from "../lib/db";
import { ConferenceRepo, DistrictRepo, ChurchRepo } from "../repos/org";
import type { ConferenceRow, DistrictRow, ChurchRow } from "../repos/org";

function toConferenceResponse(c: ConferenceRow) {
  return {
    id: c.id,
    name: c.name,
    code: c.code,
    address: c.address,
    bank_details: c.bankDetails,
    created_at: c.createdAt,
  };
}

function toDistrictResponse(d: DistrictRow & { pastorEmail?: string | null }) {
  return {
    id: d.id,
    name: d.name,
    conference_id: d.conferenceId,
    pastor_user_id: d.pastorUserId,
    pastor_email: d.pastorEmail ?? null,
    created_at: d.createdAt,
  };
}

function toChurchResponse(c: ChurchRow & { districtName?: string | null }) {
  return {
    id: c.id,
    name: c.name,
    code: c.code,
    type: c.type,
    parent_id: c.parentId,
    parent_type: c.parentType,
    district_id: c.districtId,
    district_name: c.districtName ?? null,
    address: c.address,
    bank_details: c.bankDetails,
    charter_status: c.charterStatus,
    founded_date: c.foundedDate,
    created_at: c.createdAt,
  };
}

export async function handleGetConferences(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["org:read"]!);
  if (forbidden) return forbidden;

  const confRepo = new ConferenceRepo(createDb(env));
  const conferences = await confRepo.findAll();

  return json({ conferences: conferences.map(toConferenceResponse) });
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

  const confRepo = new ConferenceRepo(createDb(env));

  const existing = await confRepo.findByCode(body.code);
  if (existing) {
    return json({ error: "Conference code already exists" }, 409);
  }

  const result = await confRepo.create({
    name: body.name,
    code: body.code,
    address: body.address,
    bankDetails: body.bankDetails,
  });

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

  const confRepo = new ConferenceRepo(createDb(env));
  const existing = await confRepo.findById(conferenceId);
  if (!existing) {
    return json({ error: "Conference not found" }, 404);
  }

  const prevState = JSON.stringify(existing);

  const updated = await confRepo.update(conferenceId, body);

  if (updated) {
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
  const districtRepo = new DistrictRepo(createDb(env));
  const districts = await districtRepo.findAll(conferenceId);

  const enriched = await Promise.all(
    districts.map(async (d) => {
      let pastorEmail: string | null = null;
      if (d.pastorUserId) {
        const user = await env.DB.prepare("SELECT email FROM users WHERE id = ?")
          .bind(d.pastorUserId)
          .first<{ email: string }>();
        pastorEmail = user?.email ?? null;
      }
      return toDistrictResponse({ ...d, pastorEmail });
    })
  );

  return json({ districts: enriched });
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

  const districtRepo = new DistrictRepo(createDb(env));
  const result = await districtRepo.create({
    name: body.name,
    conferenceId,
    pastorUserId: body.pastorUserId,
  });

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

  const districtRepo = new DistrictRepo(createDb(env));
  const existing = await districtRepo.findById(districtId);
  if (!existing) {
    return json({ error: "District not found" }, 404);
  }

  const prevState = JSON.stringify(existing);

  const updated = await districtRepo.update(districtId, {
    name: body.name,
    pastorUserId: body.pastorUserId,
  });

  if (updated) {
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
  const churchRepo = new ChurchRepo(createDb(env));
  const churches = await churchRepo.findAll(conferenceId);

  const enriched = await Promise.all(
    churches.map(async (c) => {
      let districtName: string | null = null;
      if (c.districtId) {
        const district = await env.DB.prepare("SELECT name FROM districts WHERE id = ?")
          .bind(c.districtId)
          .first<{ name: string }>();
        districtName = district?.name ?? null;
      }
      return toChurchResponse({ ...c, districtName });
    })
  );

  return json({ churches: enriched });
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

  const churchRepo = new ChurchRepo(createDb(env));
  const result = await churchRepo.create({
    name: body.name,
    code: churchCode,
    type: body.type,
    parentId: body.parentId,
    parentType: body.parentType,
    districtId: body.districtId,
    address: body.address,
    bankDetails: body.bankDetails,
  });

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

  const churchRepo = new ChurchRepo(createDb(env));
  const existing = await churchRepo.findById(churchId);
  if (!existing) {
    return json({ error: "Church not found" }, 404);
  }

  const prevState = JSON.stringify(existing);

  if (body.type && !["organized", "company", "branch"].includes(body.type)) {
    return json({ error: "type must be organized, company, or branch" }, 400);
  }

  const updated = await churchRepo.update(churchId, {
    name: body.name,
    code: body.code,
    type: body.type,
    districtId: body.districtId,
    address: body.address,
    bankDetails: body.bankDetails,
  });

  if (updated) {
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

  const churchRepo = new ChurchRepo(createDb(env));

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

    const result = await churchRepo.create({
      name,
      code: name.toLowerCase().replace(/\s+/g, "_"),
      type,
      parentId: body.conferenceId,
      parentType: "conference",
      districtId: districtId ?? undefined,
    });

    created.push({ name, type, id: result.id });
  }

  return json({ created, errors });
}
