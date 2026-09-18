import { and, eq, isNull, or } from 'drizzle-orm'
import type { AuditContext } from './audit'
import { recordAudit } from './audit'
import type { Database } from './client'
import { churchFundCategories, churches, districts, fundCategories } from './schema'

export async function createFundCategory(
  db: Database,
  missionId: number,
  name: string,
  isTithe: boolean,
  ctx: AuditContext,
) {
  const [category] = await db
    .insert(fundCategories)
    .values({ missionId, name, isTithe })
    .returning()
  await recordAudit(db, 'fund_category', category.id, 'create', ctx)
  return category
}

// The standard denomination-wide list from CONTEXT.md > Data model
// notes — a provisional starting point per that doc, pending Fiji
// Mission's actual Calendar of Offerings. A Mission can edit its list
// after this (add more via createFundCategory, remove via
// deactivateFundCategory); this just seeds where every new Mission
// starts.
const DEFAULT_FUND_CATEGORIES: { name: string; isTithe: boolean }[] = [
  { name: 'Tithe', isTithe: true },
  { name: 'Local Church Budget', isTithe: false },
  { name: 'Sabbath School/Mission Offering', isTithe: false },
  { name: 'World Budget', isTithe: false },
  { name: 'Ingathering', isTithe: false },
  { name: 'Disaster & Famine Relief', isTithe: false },
  { name: 'Thirteenth Sabbath Offering', isTithe: false },
  { name: 'Calendar of Offerings (Special Days)', isTithe: false },
  { name: 'Trust/Designated Funds', isTithe: false },
]

export async function seedDefaultFundCategories(db: Database, missionId: number, ctx: AuditContext) {
  const created = []
  for (const category of DEFAULT_FUND_CATEGORIES) {
    created.push(await createFundCategory(db, missionId, category.name, category.isTithe, ctx))
  }
  return created
}

// Soft-delete only — see the comment on fundCategories in schema.ts
// for why. No reactivate function yet; not asked for by #10, and
// easy to add later without a migration.
export async function deactivateFundCategory(db: Database, categoryId: number, ctx: AuditContext) {
  await db.update(fundCategories).set({ active: false }).where(eq(fundCategories.id, categoryId))
  await recordAudit(db, 'fund_category', categoryId, 'deactivate', ctx)
}

export function listFundCategoriesForMission(
  db: Database,
  missionId: number,
  { includeInactive = false }: { includeInactive?: boolean } = {},
) {
  const missionMatch = eq(fundCategories.missionId, missionId)
  return db
    .select()
    .from(fundCategories)
    .where(includeInactive ? missionMatch : and(missionMatch, eq(fundCategories.active, true)))
}

// Upserts the church's override. enabled=true when the row already
// matches the default (no prior override) still creates a row —
// deliberately: it makes "a Clerk touched this" visible in the data,
// not just in a hard-to-query audit_log scan, and the unique index
// keeps repeated toggles idempotent rather than piling up rows.
export async function setChurchFundCategoryEnabled(
  db: Database,
  churchId: number,
  fundCategoryId: number,
  enabled: boolean,
  ctx: AuditContext,
) {
  await db
    .insert(churchFundCategories)
    .values({ churchId, fundCategoryId, enabled })
    .onConflictDoUpdate({
      target: [churchFundCategories.churchId, churchFundCategories.fundCategoryId],
      set: { enabled, updatedAt: new Date().toISOString() },
    })
  await recordAudit(db, 'church_fund_category', fundCategoryId, enabled ? 'enable' : 'disable', {
    ...ctx,
    metadata: { churchId, ...(typeof ctx.metadata === 'object' ? ctx.metadata : {}) },
  })
}

// The count-entry form's core query (a later ticket): every category
// active for this church. A category applies unless a Clerk has
// explicitly disabled it for this specific church — see the comment
// on churchFundCategories in schema.ts.
export function listActiveFundCategoriesForChurch(db: Database, churchId: number) {
  return db
    .select({
      id: fundCategories.id,
      missionId: fundCategories.missionId,
      name: fundCategories.name,
      isTithe: fundCategories.isTithe,
    })
    .from(churches)
    .innerJoin(districts, eq(churches.districtId, districts.id))
    .innerJoin(
      fundCategories,
      and(eq(fundCategories.missionId, districts.missionId), eq(fundCategories.active, true)),
    )
    .leftJoin(
      churchFundCategories,
      and(
        eq(churchFundCategories.churchId, churches.id),
        eq(churchFundCategories.fundCategoryId, fundCategories.id),
      ),
    )
    .where(
      and(
        eq(churches.id, churchId),
        or(isNull(churchFundCategories.enabled), eq(churchFundCategories.enabled, true)),
      ),
    )
}
