import type { Env, FundAllocation, FundType, OfferingPlan, Organization } from '../types';
import { getOrgHierarchy, OrgHierarchy } from './hierarchy';

export interface AllocationResult {
  id: string;
  transaction_id: string;
  fund_type: FundType;
  amount: number;
  destination_org_id: string;
  created_at: string;
}

/**
 * Allocate a restricted fund transaction.
 * Restricted funds stay 100% at the local church level per donor intent.
 * Cannot be commingled with general offerings.
 */
export async function allocateRestricted(
  db: D1Database,
  tenantId: string,
  transactionId: string,
  amount: number,
  churchOrgId: string
): Promise<AllocationResult[]> {
  const allocation: AllocationResult = {
    id: crypto.randomUUID(),
    transaction_id: transactionId,
    fund_type: 'restricted',
    amount,
    destination_org_id: churchOrgId,
    created_at: new Date().toISOString(),
  };

  await db.prepare(
    'INSERT INTO fund_allocations (id, transaction_id, fund_type, amount, destination_org_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(allocation.id, transactionId, 'restricted', amount, churchOrgId, allocation.created_at)
    .run();

  await updateBalance(db, tenantId, churchOrgId, 'restricted', amount);

  return [allocation];
}

/**
 * Allocate a tithe transaction.
 * Tithe: 100% flows to the parent Mission.
 * Local church is custodian only.
 */
export async function allocateTithe(
  db: D1Database,
  tenantId: string,
  transactionId: string,
  amount: number,
  churchOrgId: string
): Promise<AllocationResult[]> {
  const hierarchy = await getOrgHierarchy(db, churchOrgId, tenantId);
  const mission = hierarchy.mission;

  if (!mission) {
    throw new Error('No parent Mission found for tithe allocation');
  }

  const allocation: AllocationResult = {
    id: crypto.randomUUID(),
    transaction_id: transactionId,
    fund_type: 'tithe',
    amount,
    destination_org_id: mission.id,
    created_at: new Date().toISOString(),
  };

  await db.prepare(
    'INSERT INTO fund_allocations (id, transaction_id, fund_type, amount, destination_org_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(allocation.id, transactionId, 'tithe', amount, mission.id, allocation.created_at)
    .run();

  // Update balances: church custodian balance stays 0, Mission receives 100%
  await updateBalance(db, tenantId, mission.id, 'tithe', amount);

  return [allocation];
}

/**
 * Allocate an offering transaction per the Combined Offering Plan.
 * Default split: local%, conference%, union%, gc%
 */
export async function allocateOffering(
  db: D1Database,
  tenantId: string,
  transactionId: string,
  amount: number,
  churchOrgId: string
): Promise<AllocationResult[]> {
  const hierarchy = await getOrgHierarchy(db, churchOrgId, tenantId);

  // Fetch offering plan for this tenant
  const plan = await db.prepare(
    'SELECT * FROM offering_plans WHERE tenant_id = ?'
  )
    .bind(tenantId)
    .first<OfferingPlan>();

  if (!plan) {
    throw new Error('No offering plan configured for this tenant');
  }

  const allocations: AllocationResult[] = [];
  const now = new Date().toISOString();

  // Calculate splits with rounding reconciliation
  const splits: { org: Organization | null; percent: number }[] = [
    { org: hierarchy.local_church, percent: plan.local_percent },
    { org: hierarchy.conference, percent: plan.conference_percent },
    { org: hierarchy.union, percent: plan.union_percent },
    { org: hierarchy.general_conference, percent: plan.gc_percent },
  ];

  // Calculate raw splits
  const rawSplits = splits
    .filter(s => s.org && s.percent > 0)
    .map(s => ({ org: s.org!, amount: Math.round(amount * s.percent / 100) }));

  // Reconcile rounding: adjust the largest split to make total match
  const rawTotal = rawSplits.reduce((sum, s) => sum + s.amount, 0);
  const diff = amount - rawTotal;
  if (diff !== 0 && rawSplits.length > 0) {
    const largest = rawSplits.reduce((max, s) => s.amount > max.amount ? s : max);
    largest.amount += diff;
  }

  for (const split of rawSplits) {
    if (split.amount <= 0) continue;

    const allocation: AllocationResult = {
      id: crypto.randomUUID(),
      transaction_id: transactionId,
      fund_type: 'offering',
      amount: split.amount,
      destination_org_id: split.org.id,
      created_at: now,
    };

    await db.prepare(
      'INSERT INTO fund_allocations (id, transaction_id, fund_type, amount, destination_org_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(allocation.id, transactionId, 'offering', split.amount, split.org.id, now)
      .run();

    // Update balance
    await updateBalance(db, tenantId, split.org.id, 'offering', split.amount);

    allocations.push(allocation);
  }

  return allocations;
}

/**
 * Update or create a balance record.
 */
async function updateBalance(
  db: D1Database,
  tenantId: string,
  orgId: string,
  fundType: FundType,
  amountToAdd: number
): Promise<void> {
  const existing = await db.prepare(
    'SELECT * FROM balances WHERE organization_id = ? AND fund_type = ? AND tenant_id = ?'
  )
    .bind(orgId, fundType, tenantId)
    .first<{ id: string; amount: number }>();

  const now = new Date().toISOString();

  if (existing) {
    const newAmount = existing.amount + amountToAdd;
    await db.prepare(
      'UPDATE balances SET amount = ?, updated_at = ? WHERE id = ?'
    )
      .bind(newAmount, now, existing.id)
      .run();
  } else {
    await db.prepare(
      'INSERT INTO balances (id, tenant_id, organization_id, fund_type, amount, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(crypto.randomUUID(), tenantId, orgId, fundType, amountToAdd, now)
      .run();
  }
}

/**
 * Get all allocations for a transaction (tenant-scoped).
 */
export async function getAllocationsForTransaction(
  db: D1Database,
  transactionId: string,
  tenantId: string
): Promise<FundAllocation[]> {
  const result = await db.prepare(
    'SELECT fa.* FROM fund_allocations fa JOIN transactions t ON fa.transaction_id = t.id WHERE fa.transaction_id = ? AND t.tenant_id = ?'
  )
    .bind(transactionId, tenantId)
    .all<FundAllocation>();

  return result.results;
}
