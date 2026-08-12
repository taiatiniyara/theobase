import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import {
  orgUnit,
  churchExtension,
  user,
  orgAudit,
  type OrgLevel,
  type OrgFacet,
  type OrgKind,
} from '@theobase/shared';
import type { Env } from './env';

interface SpineUnit {
  id: string;
  parentId: string | null;
  name: string;
  level: OrgLevel;
  kind: OrgKind;
  code: string;
  facets: OrgFacet[];
}

// ADR-0018: the reference spine the operator stands up first. GC → SPD → TPUM → Fiji Mission → Suva Central.
const FIJI_SPINE: SpineUnit[] = [
  {
    id: 'gc',
    parentId: null,
    name: 'General Conference',
    level: 'gc',
    kind: 'general-conference',
    code: 'GC',
    facets: ['aggregator'],
  },
  {
    id: 'spd',
    parentId: 'gc',
    name: 'South Pacific Division',
    level: 'division',
    kind: 'division',
    code: 'SPD',
    facets: ['aggregator', 'subscribable'],
  },
  {
    id: 'tpum',
    parentId: 'spd',
    name: 'Trans-Pacific Union Mission',
    level: 'union',
    kind: 'union-mission',
    code: 'TPUM',
    facets: ['aggregator', 'subscribable'],
  },
  {
    id: 'fiji-mission',
    parentId: 'tpum',
    name: 'Fiji Mission',
    level: 'conference',
    kind: 'mission',
    code: 'FIJI',
    facets: ['aggregator', 'subscribable'],
  },
  {
    id: 'suva-central',
    parentId: 'fiji-mission',
    name: 'Suva Central SDA Church',
    level: 'church',
    kind: 'church',
    code: 'SUVA-CENTRAL',
    facets: ['tenant'],
  },
];

export interface OrgSeedResult {
  operator: { created: boolean; id: string };
  units: Array<{ id: string; created: boolean }>;
}

export async function seedOrgHierarchy(env: Env): Promise<OrgSeedResult> {
  if (!env.DB) throw new Error('DB (D1) binding not configured');

  const db = drizzle(env.DB);
  const operatorEmail = env.SEED_OPERATOR_EMAIL ?? 'taiatiniyara@gmail.com';
  const now = Math.floor(Date.now() / 1000);

  const existingOperator = await db.select({ id: user.id }).from(user).where(eq(user.email, operatorEmail)).get();
  let operatorId = existingOperator?.id;
  let operatorCreated = false;

  if (!operatorId) {
    operatorId = crypto.randomUUID();
    await db
      .insert(user)
      .values({
        id: operatorId,
        email: operatorEmail,
        name: 'Taia Tiniyara',
        isSuperAdmin: true,
        tokenVersion: 1,
      })
      .onConflictDoNothing();
    operatorCreated = true;
  }

  const result: OrgSeedResult = {
    operator: { created: operatorCreated, id: operatorId },
    units: [],
  };

  for (const unit of FIJI_SPINE) {
    const existing = await db.select({ id: orgUnit.id }).from(orgUnit).where(eq(orgUnit.id, unit.id)).get();
    if (existing) {
      result.units.push({ id: unit.id, created: false });
      continue;
    }

    await db
      .insert(orgUnit)
      .values({
        id: unit.id,
        parentId: unit.parentId,
        name: unit.name,
        level: unit.level,
        kind: unit.kind,
        status: 'organized',
        code: unit.code,
        facets: unit.facets,
      })
      .onConflictDoNothing();

    if (unit.level === 'church') {
      await db
        .insert(churchExtension)
        .values({
          id: unit.id,
          doClass: 'ChurchDO',
          address: '3 Thurston St, Suva',
          status: 'active',
        })
        .onConflictDoNothing();
    }

    await db.insert(orgAudit).values({
      id: crypto.randomUUID(),
      actor: operatorId,
      action: 'unit:create',
      unitId: unit.id,
      after: unit as unknown as Record<string, unknown>,
      reason: 'Seed: reference spine',
      timestamp: now,
    });

    result.units.push({ id: unit.id, created: true });
  }

  return result;
}