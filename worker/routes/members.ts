import { authorize, type AuthContext } from "../lib/middleware";
import { PERMISSIONS } from "../lib/roles";
import { logAudit, getDeviceInfo } from "../lib/audit";
import { createNotification } from "./notifications";
import { createDb } from "../lib/db";
import { MemberRepo } from "../repos/members";
import { HouseholdRepo } from "../repos/households";
import { PositionRepo } from "../repos/positions";
import { TransferRepo } from "../repos/transfers";
import { ChurchRepo } from "../repos/org";
import { UserRepo } from "../repos/users";
import { FundRepo, TransactionRepo } from "../repos/finance";
import { json } from "../lib/response";

function validateEnum(value: string, allowed: string[], name: string): string | null {
  if (!allowed.includes(value)) {
    return `${name} must be one of: ${allowed.join(", ")}`;
  }
  return null;
}

const BAPTISM_TYPES = ["immersion", "profession_of_faith"];
const REMOVAL_REASONS = ["deceased", "missing", "apostasy"];

import type { MemberRow } from "../repos/members";
import type { HouseholdRow } from "../repos/households";

function toMemberResponse(m: MemberRow) {
  return {
    id: m.id,
    church_id: m.churchId,
    household_id: m.householdId,
    full_name: m.fullName,
    preferred_name: m.preferredName,
    dob: m.dob,
    gender: m.gender,
    baptism_date: m.baptismDate,
    baptism_type: m.baptismType,
    join_date: m.joinDate,
    prev_church_id: m.prevChurchId,
    phone: m.phone,
    email: m.email,
    address: m.address,
    marital_status: m.maritalStatus,
    status: m.status,
    status_date: m.statusDate,
    created_at: m.createdAt,
    updated_at: m.updatedAt,
    version: m.version,
  };
}

function toHouseholdResponse(h: HouseholdRow) {
  return {
    id: h.id,
    church_id: h.churchId,
    head_member_id: h.headMemberId,
    name: h.name,
    address: h.address,
    created_at: h.createdAt,
  };
}

// ── Members ──

export async function handleGetMembers(
  request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const forbidden = authorize(auth, PERMISSIONS["members:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const memberRepo = new MemberRepo(createDb(env, auth.conferenceId));

  const members = await memberRepo.findAll({
    churchId: url.searchParams.get("church_id")
      ? Number(url.searchParams.get("church_id"))
      : undefined,
    status: url.searchParams.get("status") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
  });

  return json({ members: members.map(toMemberResponse) });
}

export async function handleGetMember(
  request: Request,
  env: Env,
  auth: AuthContext,
  memberId: number
): Promise<Response> {
  const forbidden = authorize(auth, PERMISSIONS["members:read"]!);
  if (forbidden) return forbidden;

  const memberRepo = new MemberRepo(createDb(env, auth.conferenceId));
  const member = await memberRepo.findById(memberId);

  if (!member) {
    return json({ error: "Member not found" }, 404);
  }

  const churchRepo = new ChurchRepo(createDb(env, auth.conferenceId));
  const church = await churchRepo.findById(member.churchId);
  const householdRepo = new HouseholdRepo(createDb(env, auth.conferenceId));
  const household = member.householdId ? await householdRepo.findById(member.householdId) : null;

  const positionRepo = new PositionRepo(createDb(env, auth.conferenceId));
  const positions = await positionRepo.findByMember(memberId);

  return json({
    ...toMemberResponse(member),
    church_name: church?.name ?? null,
    household_name: household?.name ?? null,
    positions: positions.map((p) => ({
      id: p.id,
      name: p.name,
      module: p.module,
      start_date: p.startDate,
      end_date: p.endDate,
    })),
  });
}

export async function handleCreateMember(
  request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
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

  const churchRepo = new ChurchRepo(createDb(env, auth.conferenceId));
  const church = await churchRepo.findById(body.churchId);
  if (!church) {
    return json({ error: "Church not found" }, 404);
  }

  const memberRepo = new MemberRepo(createDb(env, auth.conferenceId));
  const result = await memberRepo.create(body);

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
  auth: AuthContext,
  memberId: number
): Promise<Response> {
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

  const memberRepo = new MemberRepo(createDb(env, auth.conferenceId));
  const existing = await memberRepo.findById(memberId);
  if (!existing) {
    return json({ error: "Member not found" }, 404);
  }
  if (existing.version !== body.version) {
    return json({ error: "Conflict: member has been modified. Refresh and try again." }, 409);
  }

  const prevState = JSON.stringify(existing);

  const updated = await memberRepo.update(memberId, body);
  if (!updated) {
    return json({ error: "No fields to update" }, 400);
  }

  const fresh = await memberRepo.findById(memberId);

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "update",
    entity_type: "member",
    entity_id: memberId,
    prev_state: prevState,
    new_state: JSON.stringify(fresh),
    module: "members",
    device_info: getDeviceInfo(request),
  });

  return json({ member: fresh });
}

export async function handleRemoveMember(
  request: Request,
  env: Env,
  auth: AuthContext,
  memberId: number
): Promise<Response> {
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

  const memberRepo = new MemberRepo(createDb(env, auth.conferenceId));
  const prevMember = await memberRepo.findById(memberId);
  const prevState = prevMember ? JSON.stringify(prevMember) : null;

  await memberRepo.setStatus(memberId, newStatus, statusDate);

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

export async function handleGetHouseholds(
  request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const forbidden = authorize(auth, PERMISSIONS["members:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const churchId = url.searchParams.get("church_id")
    ? Number(url.searchParams.get("church_id"))
    : undefined;

  const householdRepo = new HouseholdRepo(createDb(env, auth.conferenceId));
  const households = await householdRepo.findByChurch(churchId);

  // Enrich with head member name and count
  const memberRepo = new MemberRepo(createDb(env, auth.conferenceId));
  const enriched = await Promise.all(
    households.map(async (h) => {
      const base = toHouseholdResponse(h);
      let headName: string | null = null;
      let memberCount = 0;
      if (h.headMemberId) {
        const m = await memberRepo.findById(h.headMemberId);
        headName = m?.fullName ?? null;
      }
      const count = await env.DB.prepare("SELECT COUNT(*) as c FROM members WHERE household_id = ?")
        .bind(h.id)
        .first<{ c: number }>();
      memberCount = count?.c ?? 0;
      return { ...base, head_member_name: headName, member_count: memberCount };
    })
  );

  return json({ households: enriched });
}

export async function handleCreateHousehold(
  request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
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

  const householdRepo = new HouseholdRepo(createDb(env, auth.conferenceId));
  const result = await householdRepo.create(body);

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
  auth: AuthContext,
  householdId: number
): Promise<Response> {
  const forbidden = authorize(auth, PERMISSIONS["members:write"]!);
  if (forbidden) return forbidden;

  let body: { name?: string; address?: string; headMemberId?: number | null };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const householdRepo = new HouseholdRepo(createDb(env, auth.conferenceId));
  const existing = await householdRepo.findById(householdId);
  if (!existing) {
    return json({ error: "Household not found" }, 404);
  }

  const prevState = JSON.stringify(existing);

  const updated = await householdRepo.update(householdId, {
    name: body.name,
    address: body.address,
    headMemberId: body.headMemberId ?? undefined,
  });

  if (updated) {
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

export async function handleGetPositions(
  request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const forbidden = authorize(auth, PERMISSIONS["members:read"]!);
  if (forbidden) return forbidden;

  const positionRepo = new PositionRepo(createDb(env, auth.conferenceId));
  const positions = await positionRepo.findAll();

  return json({ positions });
}

export async function handleCreatePosition(
  request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
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

  const positionRepo = new PositionRepo(createDb(env, auth.conferenceId));
  const existing = await positionRepo.findByName(body.name);
  if (existing) {
    return json({ error: "Position already exists" }, 409);
  }

  let result;
  try {
    result = await positionRepo.create(body.name, body.module ?? "core");
  } catch (err: unknown) {
    const msg = String(err);
    if (msg.includes("UNIQUE") || msg.includes("constraint")) {
      return json({ error: "Position already exists" }, 409);
    }
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
  auth: AuthContext,
  memberId: number
): Promise<Response> {
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

  const memberRepo = new MemberRepo(createDb(env, auth.conferenceId));
  const member = await memberRepo.findById(memberId);
  if (!member) {
    return json({ error: "Member not found" }, 404);
  }

  const positionRepo = new PositionRepo(createDb(env, auth.conferenceId));
  const position = await positionRepo.findById(body.positionId);
  if (!position) {
    return json({ error: "Position not found" }, 404);
  }

  const hasPosition = await positionRepo.hasActivePosition(memberId, body.positionId);
  if (hasPosition) {
    return json({ error: "Member already holds this position" }, 409);
  }

  await positionRepo.assign(memberId, body.positionId, body.startDate);

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
  auth: AuthContext,
  memberId: number,
  positionId: number
): Promise<Response> {
  const forbidden = authorize(auth, PERMISSIONS["members:write"]!);
  if (forbidden) return forbidden;

  const positionRepo = new PositionRepo(createDb(env, auth.conferenceId));
  const hasPosition = await positionRepo.hasActivePosition(memberId, positionId);
  if (!hasPosition) {
    return json({ error: "Member does not hold this position" }, 404);
  }

  await positionRepo.removeActive(memberId, positionId);

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

export async function handleGetTransfers(
  request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const forbidden = authorize(auth, PERMISSIONS["members:read"]!);
  if (forbidden) return forbidden;

  const transferRepo = new TransferRepo(createDb(env, auth.conferenceId));
  const memberRepo = new MemberRepo(createDb(env, auth.conferenceId));

  // Auto-expire stale transfers
  try {
    const expiredIds = await transferRepo.expireStale();
    for (const memberId of expiredIds) {
      await memberRepo.reactivate(memberId);
      await logAudit(env, {
        actor_id: 0,
        action: "auto_expire",
        entity_type: "transfer",
        entity_id: memberId,
        prev_state: JSON.stringify({ memberStatus: "transferred" }),
        new_state: JSON.stringify({ memberStatus: "active", reason: "transfer_expired" }),
        module: "members",
        device_info: "system",
      });
    }
  } catch {
    // Graceful degradation if schema not yet migrated
  }

  const url = new URL(request.url);
  const transfers = await transferRepo.findAll({
    churchId: url.searchParams.get("church_id")
      ? Number(url.searchParams.get("church_id"))
      : undefined,
    status: url.searchParams.get("status") ?? undefined,
  });

  // Enrich with names (cross-entity data)
  const churchRepo = new ChurchRepo(createDb(env, auth.conferenceId));
  const enriched = await Promise.all(
    transfers.map(async (tr) => {
      const member = await memberRepo.findById(tr.memberId);
      const fc = await churchRepo.findById(tr.fromChurchId);
      const tc = await churchRepo.findById(tr.toChurchId);
      return {
        ...tr,
        member_name: member?.fullName ?? null,
        from_church_name: fc?.name ?? null,
        to_church_name: tc?.name ?? null,
      };
    })
  );

  return json({ transfers: enriched });
}

export async function handleInitiateTransfer(
  request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
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

  const memberRepo = new MemberRepo(createDb(env, auth.conferenceId));
  const member = await memberRepo.findById(body.memberId);
  if (!member) return json({ error: "Member not found" }, 404);
  if (member.status !== "active") {
    return json({ error: "Only active members can be transferred" }, 400);
  }

  const churchRepo = new ChurchRepo(createDb(env, auth.conferenceId));
  const toChurch = await churchRepo.findById(body.toChurchId);
  if (!toChurch) return json({ error: "Destination church not found" }, 404);
  if (member.churchId === body.toChurchId) {
    return json({ error: "Cannot transfer to the same church" }, 400);
  }

  const transferRepo = new TransferRepo(createDb(env, auth.conferenceId));
  const hasPending = await transferRepo.hasPendingForMember(body.memberId);
  if (hasPending) {
    return json({ error: "A pending transfer already exists for this member" }, 409);
  }

  const result = await transferRepo.create({
    memberId: body.memberId,
    fromChurchId: member.churchId,
    toChurchId: body.toChurchId,
    initiatedBy: Number(auth.userId),
  });

  await memberRepo.setStatus(body.memberId, "transferred", new Date().toISOString());

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "initiate",
    entity_type: "transfer",
    entity_id: result.id,
    prev_state: null,
    new_state: JSON.stringify({
      memberId: body.memberId,
      fromChurchId: member.churchId,
      toChurchId: body.toChurchId,
    }),
    module: "members",
    device_info: getDeviceInfo(request),
  });

  // Notify conference officers
  const fromChurch = await churchRepo.findById(member.churchId);
  const toChurchName = await churchRepo.findById(body.toChurchId);
  const memberName = await memberRepo.findById(body.memberId);

  const confUsers = await env.DB.prepare(
    `SELECT u.id FROM users u
     JOIN churches c ON c.parent_id = u.conference_id AND c.parent_type = 'conference'
     WHERE c.id = ? AND u.role IN ('secretary', 'president')`
  )
    .bind(member.churchId)
    .all<{ id: number }>();

  for (const u of confUsers.results) {
    await createNotification(
      env,
      u.id,
      "transfer_initiated",
      "transfer",
      result.id,
      `Transfer requested: ${memberName?.fullName ?? "Member"} from ${fromChurch?.name ?? "source"} to ${toChurchName?.name ?? "destination"}`
    );
  }

  return json({ id: result.id, memberId: body.memberId, status: "pending_conference" }, 201);
}

export async function handleApproveTransfer(
  request: Request,
  env: Env,
  auth: AuthContext,
  transferId: number
): Promise<Response> {
  const forbidden = authorize(auth, PERMISSIONS["members:write"]!);
  if (forbidden) return forbidden;

  const transferRepo = new TransferRepo(createDb(env, auth.conferenceId));
  const transfer = await transferRepo.findById(transferId);
  if (!transfer) return json({ error: "Transfer not found" }, 404);
  if (transfer.status !== "pending_conference") {
    return json({ error: "Transfer cannot be approved in its current state" }, 400);
  }

  await transferRepo.approve(transferId, Number(auth.userId));

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

  // Notify destination church
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
  auth: AuthContext,
  transferId: number
): Promise<Response> {
  const forbidden = authorize(auth, PERMISSIONS["members:write"]!);
  if (forbidden) return forbidden;

  const transferRepo = new TransferRepo(createDb(env, auth.conferenceId));
  const transfer = await transferRepo.findById(transferId);
  if (!transfer) return json({ error: "Transfer not found" }, 404);
  if (transfer.status !== "pending_destination") {
    return json({ error: "Transfer cannot be accepted in its current state" }, 400);
  }

  await transferRepo.accept(transferId, Number(auth.userId));

  const memberRepo = new MemberRepo(createDb(env, auth.conferenceId));
  await memberRepo.transferTo(transfer.memberId, transfer.toChurchId, transfer.fromChurchId);

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "accept",
    entity_type: "transfer",
    entity_id: transferId,
    prev_state: JSON.stringify({ status: "pending_destination" }),
    new_state: JSON.stringify({ status: "completed", newChurchId: transfer.toChurchId }),
    module: "members",
    device_info: getDeviceInfo(request),
  });

  // Notify source church
  const tr = await env.DB.prepare(
    `SELECT tr.member_id, tr.from_church_id, m.full_name
     FROM transfer_requests tr JOIN members m ON tr.member_id = m.id WHERE tr.id = ?`
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
  auth: AuthContext,
  transferId: number
): Promise<Response> {
  const forbidden = authorize(auth, PERMISSIONS["members:write"]!);
  if (forbidden) return forbidden;

  let body: { note?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Body is optional
  }

  const transferRepo = new TransferRepo(createDb(env, auth.conferenceId));
  const transfer = await transferRepo.findById(transferId);
  if (!transfer) return json({ error: "Transfer not found" }, 404);
  if (!["pending_conference", "pending_destination"].includes(transfer.status)) {
    return json({ error: "Transfer cannot be rejected in its current state" }, 400);
  }

  await transferRepo.reject(transferId, body.note);

  const memberRepo = new MemberRepo(createDb(env, auth.conferenceId));
  await memberRepo.reactivate(transfer.memberId);

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "reject",
    entity_type: "transfer",
    entity_id: transferId,
    prev_state: JSON.stringify({ status: transfer.status }),
    new_state: JSON.stringify({ status: "rejected", note: body.note }),
    module: "members",
    device_info: getDeviceInfo(request),
  });

  // Notify source church
  const tr = await env.DB.prepare(
    `SELECT m.full_name FROM transfer_requests tr
     JOIN members m ON tr.member_id = m.id WHERE tr.id = ?`
  )
    .bind(transferId)
    .first<{ full_name: string }>();

  const srcUsers = await env.DB.prepare(
    `SELECT u.id FROM users u
     JOIN members m ON u.member_id = m.id AND m.church_id = ?
     WHERE u.role IN ('secretary', 'pastor')`
  )
    .bind(transfer.fromChurchId)
    .all<{ id: number }>();

  for (const u of srcUsers.results) {
    await createNotification(
      env,
      u.id,
      "transfer_rejected",
      "transfer",
      transferId,
      `Transfer rejected for ${tr?.full_name ?? "member"}${body.note ? `: ${body.note}` : ""}`
    );
  }

  return json({ success: true, status: "rejected" });
}

export async function handleOverrideTransfer(
  request: Request,
  env: Env,
  auth: AuthContext,
  transferId: number
): Promise<Response> {
  const userRepo = new UserRepo(createDb(env, auth.conferenceId));
  const user = await userRepo.findById(Number(auth.userId));
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

  const transferRepo = new TransferRepo(createDb(env, auth.conferenceId));
  const transfer = await transferRepo.findById(transferId);
  if (!transfer) return json({ error: "Transfer not found" }, 404);
  if (!["pending_conference", "pending_destination"].includes(transfer.status)) {
    return json({ error: "Transfer cannot be overridden in its current state" }, 400);
  }

  const memberRepo = new MemberRepo(createDb(env, auth.conferenceId));

  if (body.action === "force_approve") {
    if (transfer.status === "pending_conference") {
      await transferRepo.overrideToDestination(transferId, Number(auth.userId), body.note);
    } else {
      await transferRepo.override(transferId, "force_approve", Number(auth.userId), body.note);
      await memberRepo.transferTo(transfer.memberId, transfer.toChurchId, transfer.fromChurchId);
    }
  } else {
    await transferRepo.override(transferId, "force_reject", Number(auth.userId), body.note);
    await memberRepo.reactivate(transfer.memberId);
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
  auth: AuthContext,
  churchId: number
): Promise<Response> {
  const userRepo = new UserRepo(createDb(env, auth.conferenceId));
  const user = await userRepo.findById(Number(auth.userId));
  if (!user || !user.memberId) {
    return json({ error: "No member record linked to your account" }, 404);
  }

  const memberRepo = new MemberRepo(createDb(env, auth.conferenceId));
  const member = await memberRepo.findByIdAndChurch(user.memberId, churchId);
  if (!member) {
    return json({ error: "Member not found in this church" }, 404);
  }

  return json(toMemberResponse(member));
}

export async function handleUpdateSelfMember(
  request: Request,
  env: Env,
  auth: AuthContext,
  churchId: number
): Promise<Response> {
  const userRepo = new UserRepo(createDb(env, auth.conferenceId));
  const user = await userRepo.findById(Number(auth.userId));
  if (!user || !user.memberId) {
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

  const memberRepo = new MemberRepo(createDb(env, auth.conferenceId));
  const existing = await memberRepo.findByIdAndChurch(user.memberId, churchId);
  if (!existing) {
    return json({ error: "Member not found in this church" }, 404);
  }
  if (existing.version !== body.version) {
    return json({ error: "Conflict: member has been modified. Refresh and try again." }, 409);
  }

  const updated = await memberRepo.update(user.memberId, {
    fullName: body.fullName,
    phone: body.phone,
    email: body.email,
    address: body.address,
  });
  if (!updated) {
    return json({ message: "No fields to update" });
  }

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "update",
    entity_type: "member",
    entity_id: user.memberId,
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
  auth: AuthContext,
  churchId: number,
  memberId: number
): Promise<Response> {
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

  const memberRepo = new MemberRepo(createDb(env, auth.conferenceId));
  const member = await memberRepo.findById(memberId);
  if (!member) return json({ error: "Member not found" }, 404);
  if (member.churchId !== churchId) {
    return json({ error: "Member does not belong to this church" }, 403);
  }

  if (body.proxyForMemberId) {
    if (body.proxyForMemberId === memberId) {
      return json({ error: "Cannot proxy for yourself — omit proxyForMemberId" }, 400);
    }
    const targetMember = await memberRepo.findById(body.proxyForMemberId);
    if (!targetMember) return json({ error: "Proxy target member not found" }, 404);
    if (targetMember.churchId !== churchId) {
      return json({ error: "Proxy target must be in the same church" }, 403);
    }
  }

  const fundRepo = new FundRepo(createDb(env, auth.conferenceId));
  const fund = await fundRepo.findById(body.fundId);
  if (!fund) return json({ error: "Fund not found" }, 404);

  const uuid = crypto.randomUUID();
  const effectiveMemberId = body.proxyForMemberId ?? memberId;
  const transactionRepo = new TransactionRepo(createDb(env, auth.conferenceId));
  const result = await transactionRepo.createIncome({
    churchId,
    fundId: body.fundId,
    amount: body.amount,
    description: body.description,
    createdBy: Number(auth.userId),
    uuid,
    memberId: effectiveMemberId,
    proxyForMemberId: body.proxyForMemberId ? memberId : undefined,
  });

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "declare",
    entity_type: "transaction",
    entity_id: result.id,
    prev_state: null,
    new_state: JSON.stringify({ ...body, churchId, memberId: effectiveMemberId, verified: false }),
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
  auth: AuthContext,
  churchId: number,
  memberId: number
): Promise<Response> {
  const userRepo = new UserRepo(createDb(env, auth.conferenceId));
  const user = await userRepo.findById(Number(auth.userId));
  if (!user || !user.memberId) {
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

  const memberRepo = new MemberRepo(createDb(env, auth.conferenceId));
  const member = await memberRepo.findById(memberId);
  if (!member) return json({ error: "Member not found" }, 404);
  if (member.churchId !== churchId) {
    return json({ error: "Member does not belong to this church" }, 403);
  }
  if (member.status !== "active") {
    return json({ error: "Only active members can be transferred" }, 400);
  }

  const churchRepo = new ChurchRepo(createDb(env, auth.conferenceId));
  const toChurch = await churchRepo.findById(body.toChurchId);
  if (!toChurch) return json({ error: "Destination church not found" }, 404);
  if (member.churchId === body.toChurchId) {
    return json({ error: "Cannot transfer to the same church" }, 400);
  }

  const transferRepo = new TransferRepo(createDb(env, auth.conferenceId));
  const hasPending = await transferRepo.hasPendingForMember(memberId);
  if (hasPending) {
    return json({ error: "A pending transfer already exists for this member" }, 409);
  }

  const result = await transferRepo.create({
    memberId,
    fromChurchId: member.churchId,
    toChurchId: body.toChurchId,
    initiatedBy: Number(auth.userId),
  });

  await memberRepo.setStatus(memberId, "transferred", new Date().toISOString());

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "transfer_request",
    entity_type: "transfer",
    entity_id: result.id,
    prev_state: null,
    new_state: JSON.stringify({
      memberId,
      fromChurchId: member.churchId,
      toChurchId: body.toChurchId,
      source: "member",
    }),
    module: "members",
    device_info: getDeviceInfo(request),
  });

  // Notifications
  const fromChurch = await churchRepo.findById(member.churchId);
  const toChurchName = await churchRepo.findById(body.toChurchId);

  const confUsers = await env.DB.prepare(
    `SELECT u.id FROM users u
     JOIN churches c ON c.parent_id = u.conference_id AND c.parent_type = 'conference'
     WHERE c.id = ? AND u.role IN ('secretary', 'president')`
  )
    .bind(member.churchId)
    .all<{ id: number }>();

  for (const u of confUsers.results) {
    await createNotification(
      env,
      u.id,
      "transfer_initiated",
      "transfer",
      result.id,
      `Transfer requested: ${member.fullName} from ${fromChurch?.name ?? "source"} to ${toChurchName?.name ?? "destination"}`
    );
  }

  return json({ id: result.id, memberId, status: "pending_conference" }, 201);
}

// ── Treasurer Declaration Verification ──

export async function handleListDeclarations(
  request: Request,
  env: Env,
  auth: AuthContext,
  churchId: number
): Promise<Response> {
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
  auth: AuthContext,
  churchId: number,
  declarationId: number
): Promise<Response> {
  const forbidden = authorize(auth, PERMISSIONS["finance:write"]!);
  if (forbidden) return forbidden;

  const transactionRepo = new TransactionRepo(createDb(env, auth.conferenceId));
  const declaration = await transactionRepo.findDeclarationById(declarationId);
  if (!declaration) return json({ error: "Declaration not found" }, 404);
  if (declaration.churchId !== churchId) {
    return json({ error: "Declaration does not belong to this church" }, 403);
  }
  if (declaration.verified === 1) {
    return json({ error: "Declaration is already verified" }, 400);
  }

  await transactionRepo.verifyOne(declarationId, Number(auth.userId));

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
  auth: AuthContext,
  churchId: number,
  declarationId: number
): Promise<Response> {
  const forbidden = authorize(auth, PERMISSIONS["finance:write"]!);
  if (forbidden) return forbidden;

  const transactionRepo = new TransactionRepo(createDb(env, auth.conferenceId));
  const declaration = await transactionRepo.findDeclarationById(declarationId);
  if (!declaration) return json({ error: "Declaration not found" }, 404);
  if (declaration.churchId !== churchId) {
    return json({ error: "Declaration does not belong to this church" }, 403);
  }
  if (declaration.verified === 1) {
    return json({ error: "Declaration is already verified — cannot reject" }, 400);
  }

  await transactionRepo.deleteOne(declarationId);

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

export async function handleMemberDashboard(
  _request: Request,
  env: Env,
  auth: AuthContext,
  memberId: number
): Promise<Response> {
  const memberRepo = new MemberRepo(createDb(env, auth.conferenceId));
  const member = await memberRepo.findById(memberId);
  if (!member) return json({ error: "Member not found" }, 404);

  if (auth.role === "member") {
    const userRepo = new UserRepo(createDb(env, auth.conferenceId));
    const userRecord = await userRepo.findById(Number(auth.userId));
    if (!userRecord?.memberId || userRecord.memberId !== memberId) {
      return json({ error: "Forbidden" }, 403);
    }
  }

  const pendingDeclarations = await env.DB.prepare(
    `SELECT t.id, t.amount, t.description, t.verified, t.created_at,
     f.name as fund_name, f.type as fund_type
     FROM transactions t
     JOIN funds f ON t.fund_id = f.id
     WHERE t.member_id = ? AND t.batch_id IS NULL AND t.verified = 0
     ORDER BY t.created_at DESC`
  )
    .bind(memberId)
    .all();

  const verifiedDeclarations = await env.DB.prepare(
    `SELECT t.id, t.amount, t.description, t.verified, t.created_at,
     f.name as fund_name, f.type as fund_type
     FROM transactions t
     JOIN funds f ON t.fund_id = f.id
     WHERE t.member_id = ? AND t.batch_id IS NULL AND t.verified = 1
     ORDER BY t.created_at DESC LIMIT 10`
  )
    .bind(memberId)
    .all();

  const activeTransfer = await env.DB.prepare(
    `SELECT tr.id, tr.status, tr.initiated_at,
     fc.name as from_church_name, tc.name as to_church_name
     FROM transfer_requests tr
     JOIN churches fc ON tr.from_church_id = fc.id
     JOIN churches tc ON tr.to_church_id = tc.id
     WHERE tr.member_id = ? AND tr.status NOT IN ('completed', 'rejected')
     ORDER BY tr.initiated_at DESC LIMIT 1`
  )
    .bind(memberId)
    .first();

  const recentAttendance = await env.DB.prepare(
    `SELECT a.date, a.category, a.count
     FROM member_attendance ma
     JOIN attendance a ON ma.attendance_id = a.id
     WHERE ma.member_id = ?
     ORDER BY a.date DESC LIMIT 10`
  )
    .bind(memberId)
    .all();

  const contributionYears = await env.DB.prepare(
    `SELECT DISTINCT CAST(strftime('%Y', t.created_at) AS INTEGER) as year, t.church_id
     FROM transactions t
     WHERE t.member_id = ? AND t.confirmed_by IS NOT NULL
     ORDER BY year DESC`
  )
    .bind(memberId)
    .all();

  return json({
    memberId,
    memberName: member.fullName,
    giving: {
      pending: pendingDeclarations.results,
      verified: verifiedDeclarations.results,
    },
    activeTransfer: activeTransfer || null,
    recentAttendance: recentAttendance.results,
    contributionYears: contributionYears.results,
  });
}
