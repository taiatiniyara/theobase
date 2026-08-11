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
export type InsertErrorLog = InsertOf<typeof errorLogSchemas>;
export type InsertSyncHealth = InsertOf<typeof syncHealthSchemas>;
