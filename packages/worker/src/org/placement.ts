import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { orgUnit, placementRequest, orgAudit } from '@theobase/shared';
import type { GrantRole } from '@theobase/shared';
import { authenticate, requireRole } from '../auth/middleware';
import type { Env } from '../env';

const CONFERENCE_ADMIN_ROLES: GrantRole[] = [
  'conference-treasurer',
  'conference-secretary',
  'conference-president',
];

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ADR-0019 §2: the suggested parent derives from the existing tree, never free
// text. Walk up from the requester's active grant unit to the nearest
// Union/Division ancestor — that is the parent the new conference would sit
// under, so no one can type themselves into a contestable part of the tree.
async function suggestParentId(db: DrizzleDb, startUnitId: string | null): Promise<string | null> {
  let currentId = startUnitId;
  while (currentId) {
    const unit = await db.select().from(orgUnit).where(eq(orgUnit.id, currentId)).get();
    if (!unit) return null;
    if (unit.level === 'union' || unit.level === 'division') return unit.id;
    currentId = unit.parentId;
  }
  return null;
}

export async function handlePlacementRequest(request: Request, env: Env): Promise<Response> {
  if (!env.DB) return json({ error: 'DB binding not configured' }, 500);

  const authed = await authenticate(request, env);
  if (!authed) return json({ error: 'Unauthorized' }, 401);
  const grant = requireRole(request, CONFERENCE_ADMIN_ROLES);
  if (!grant) return json({ error: 'Forbidden: conference admin role required' }, 403);

  let body: { name?: unknown; territory?: unknown };
  try {
    body = (await request.json()) as { name?: unknown; territory?: unknown };
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const territory = typeof body.territory === 'string' ? body.territory.trim() : '';
  if (!name) return json({ error: 'name is required' }, 400);
  if (!territory) return json({ error: 'territory is required' }, 400);

  const db = drizzle(env.DB);
  const suggestedParentId = await suggestParentId(db, grant.unitId ?? null);
  if (!suggestedParentId) {
    return json(
      { error: 'No Union/Division ancestor found in the tree for your unit' },
      400,
    );
  }

  const requestId = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await db.insert(placementRequest).values({
    id: requestId,
    requestedBy: grant.sub,
    name,
    territory,
    suggestedParentId,
    status: 'pending',
  });

  await db.insert(orgAudit).values({
    id: crypto.randomUUID(),
    actor: grant.sub,
    action: 'unit:requested',
    unitId: suggestedParentId,
    after: { requestId, name, territory, suggestedParentId },
    reason: 'Placement request filed',
    timestamp: now,
  });

  return json(
    { id: requestId, name, territory, suggestedParentId, status: 'pending' },
    201,
  );
}

type DrizzleDb = ReturnType<typeof drizzle>;