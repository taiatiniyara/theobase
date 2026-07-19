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

  // Calculate splits
  const splits: { org: Organization | null; percent: number }[] = [
    { org: hierarchy.local_church, percent: plan.local_percent },
    { org: hierarchy.conference, percent: plan.conference_percent },
    { org: hierarchy.union, percent: plan.union_percent },
    { org: hierarchy.general_conference, percent: plan.gc_percent },
  ];

  for (const split of splits) {
    if (!split.org || split.percent <= 0) continue;

    const splitAmount = Math.round(amount * split.percent / 100);
    if (splitAmount <= 0) continue;

    const allocation: AllocationResult = {
      id: crypto.randomUUID(),
      transaction_id: transactionId,
      fund_type: 'offering',
      amount: splitAmount,
      destination_org_id: split.org.id,
      created_at: now,
    };

    await db.prepare(
      'INSERT INTO fund_allocations (id, transaction_id, fund_type, amount, destination_org_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(allocation.id, transactionId, 'offering', splitAmount, split.org.id, now)
      .run();

    // Update balance
    await updateBalance(db, tenantId, split.org.id, 'offering', splitAmount);

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
 * Get all allocations for a transaction.
 */
export async function getAllocationsForTransaction(
  db: D1Database,
  transactionId: string
): Promise<FundAllocation[]> {
  const result = await db.prepare(
    'SELECT * FROM fund_allocations WHERE transaction_id = ?'
  )
    .bind(transactionId)
    .all<FundAllocation>();

  return result.results;
}
