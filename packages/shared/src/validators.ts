import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from 'zod';
import {
  conference,
  church,
  user,
  roleAssignment,
  member,
  household,
  givingBatch,
  givingRecord,
  errorLog,
  syncHealth,
  costMetrics,
  restoreDrill,
  orgUnit,
  churchExtension,
  roleGrant,
  transfer,
  orgAudit,
} from './schema';

function schemasFor<T extends Parameters<typeof createInsertSchema>[0]>(table: T) {
  return {
    insert: createInsertSchema(table),
    select: createSelectSchema(table),
    update: createUpdateSchema(table),
  };
}

const conferenceSchemas = schemasFor(conference);
const churchSchemas = schemasFor(church);
const userSchemas = schemasFor(user);
const roleAssignmentSchemas = schemasFor(roleAssignment);
const memberSchemas = schemasFor(member);
const householdSchemas = schemasFor(household);
const givingBatchSchemas = schemasFor(givingBatch);
const givingRecordSchemas = schemasFor(givingRecord);
const errorLogSchemas = schemasFor(errorLog);
const syncHealthSchemas = schemasFor(syncHealth);
const costMetricsSchemas = schemasFor(costMetrics);
const restoreDrillSchemas = schemasFor(restoreDrill);
const orgUnitSchemas = schemasFor(orgUnit);
const churchExtensionSchemas = schemasFor(churchExtension);
const roleGrantSchemas = schemasFor(roleGrant);
const transferSchemas = schemasFor(transfer);
const orgAuditSchemas = schemasFor(orgAudit);

export const {
  insert: insertConferenceSchema,
  select: selectConferenceSchema,
  update: updateConferenceSchema,
} = conferenceSchemas;
export const {
  insert: insertChurchSchema,
  select: selectChurchSchema,
  update: updateChurchSchema,
} = churchSchemas;
export const {
  insert: insertUserSchema,
  select: selectUserSchema,
  update: updateUserSchema,
} = userSchemas;
export const {
  insert: insertRoleAssignmentSchema,
  select: selectRoleAssignmentSchema,
  update: updateRoleAssignmentSchema,
} = roleAssignmentSchemas;
export const {
  insert: insertMemberSchema,
  select: selectMemberSchema,
  update: updateMemberSchema,
} = memberSchemas;
export const {
  insert: insertHouseholdSchema,
  select: selectHouseholdSchema,
  update: updateHouseholdSchema,
} = householdSchemas;
export const {
  insert: insertGivingBatchSchema,
  select: selectGivingBatchSchema,
  update: updateGivingBatchSchema,
} = givingBatchSchemas;
export const {
  insert: insertGivingRecordSchema,
  select: selectGivingRecordSchema,
  update: updateGivingRecordSchema,
} = givingRecordSchemas;
export const {
  insert: insertErrorLogSchema,
  select: selectErrorLogSchema,
} = errorLogSchemas;
export const {
  insert: insertSyncHealthSchema,
  select: selectSyncHealthSchema,
} = syncHealthSchemas;
export const {
  insert: insertCostMetricsSchema,
  select: selectCostMetricsSchema,
} = costMetricsSchemas;
export const {
  insert: insertRestoreDrillSchema,
  select: selectRestoreDrillSchema,
} = restoreDrillSchemas;
export const {
  insert: insertOrgUnitSchema,
  select: selectOrgUnitSchema,
  update: updateOrgUnitSchema,
} = orgUnitSchemas;
export const {
  insert: insertChurchExtensionSchema,
  select: selectChurchExtensionSchema,
  update: updateChurchExtensionSchema,
} = churchExtensionSchemas;
export const {
  insert: insertRoleGrantSchema,
  select: selectRoleGrantSchema,
  update: updateRoleGrantSchema,
} = roleGrantSchemas;
export const {
  insert: insertTransferSchema,
  select: selectTransferSchema,
  update: updateTransferSchema,
} = transferSchemas;
export const {
  insert: insertOrgAuditSchema,
  select: selectOrgAuditSchema,
} = orgAuditSchemas;

type SelectOf<S extends { select: z.ZodTypeAny }> = z.infer<S['select']>;
type InsertOf<S extends { insert: z.ZodTypeAny }> = z.infer<S['insert']>;

export type Conference = SelectOf<typeof conferenceSchemas>;
export type Church = SelectOf<typeof churchSchemas>;
export type User = SelectOf<typeof userSchemas>;
export type RoleAssignment = SelectOf<typeof roleAssignmentSchemas>;
export type Member = SelectOf<typeof memberSchemas>;
export type Household = SelectOf<typeof householdSchemas>;
export type GivingBatch = SelectOf<typeof givingBatchSchemas>;
export type GivingRecord = SelectOf<typeof givingRecordSchemas>;

export type InsertConference = InsertOf<typeof conferenceSchemas>;
export type InsertChurch = InsertOf<typeof churchSchemas>;
export type InsertUser = InsertOf<typeof userSchemas>;
export type InsertRoleAssignment = InsertOf<typeof roleAssignmentSchemas>;
export type InsertMember = InsertOf<typeof memberSchemas>;
export type InsertHousehold = InsertOf<typeof householdSchemas>;
export type InsertGivingBatch = InsertOf<typeof givingBatchSchemas>;
export type InsertGivingRecord = InsertOf<typeof givingRecordSchemas>;
export type ErrorLog = SelectOf<typeof errorLogSchemas>;
export type SyncHealth = SelectOf<typeof syncHealthSchemas>;
export type CostMetrics = SelectOf<typeof costMetricsSchemas>;
export type RestoreDrill = SelectOf<typeof restoreDrillSchemas>;
export type InsertErrorLog = InsertOf<typeof errorLogSchemas>;
export type InsertSyncHealth = InsertOf<typeof syncHealthSchemas>;
export type InsertCostMetrics = InsertOf<typeof costMetricsSchemas>;
export type InsertRestoreDrill = InsertOf<typeof restoreDrillSchemas>;
export type OrgUnit = SelectOf<typeof orgUnitSchemas>;
export type ChurchExtension = SelectOf<typeof churchExtensionSchemas>;
export type RoleGrant = SelectOf<typeof roleGrantSchemas>;
export type Transfer = SelectOf<typeof transferSchemas>;
export type OrgAudit = SelectOf<typeof orgAuditSchemas>;
export type InsertOrgUnit = InsertOf<typeof orgUnitSchemas>;
export type InsertChurchExtension = InsertOf<typeof churchExtensionSchemas>;
export type InsertRoleGrant = InsertOf<typeof roleGrantSchemas>;
export type InsertOrgAudit = InsertOf<typeof orgAuditSchemas>;
