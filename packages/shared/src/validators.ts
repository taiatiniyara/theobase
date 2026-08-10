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
} from './schema';

export const insertConferenceSchema = createInsertSchema(conference);
export const selectConferenceSchema = createSelectSchema(conference);
export const updateConferenceSchema = createUpdateSchema(conference);

export const insertChurchSchema = createInsertSchema(church);
export const selectChurchSchema = createSelectSchema(church);
export const updateChurchSchema = createUpdateSchema(church);

export const insertUserSchema = createInsertSchema(user);
export const selectUserSchema = createSelectSchema(user);
export const updateUserSchema = createUpdateSchema(user);

export const insertRoleAssignmentSchema = createInsertSchema(roleAssignment);
export const selectRoleAssignmentSchema = createSelectSchema(roleAssignment);
export const updateRoleAssignmentSchema = createUpdateSchema(roleAssignment);

export const insertMemberSchema = createInsertSchema(member);
export const selectMemberSchema = createSelectSchema(member);
export const updateMemberSchema = createUpdateSchema(member);

export const insertHouseholdSchema = createInsertSchema(household);
export const selectHouseholdSchema = createSelectSchema(household);
export const updateHouseholdSchema = createUpdateSchema(household);

export const insertGivingBatchSchema = createInsertSchema(givingBatch);
export const selectGivingBatchSchema = createSelectSchema(givingBatch);
export const updateGivingBatchSchema = createUpdateSchema(givingBatch);

export const insertGivingRecordSchema = createInsertSchema(givingRecord);
export const selectGivingRecordSchema = createSelectSchema(givingRecord);
export const updateGivingRecordSchema = createUpdateSchema(givingRecord);

export type Conference = z.infer<typeof selectConferenceSchema>;
export type Church = z.infer<typeof selectChurchSchema>;
export type User = z.infer<typeof selectUserSchema>;
export type RoleAssignment = z.infer<typeof selectRoleAssignmentSchema>;
export type Member = z.infer<typeof selectMemberSchema>;
export type Household = z.infer<typeof selectHouseholdSchema>;
export type GivingBatch = z.infer<typeof selectGivingBatchSchema>;
export type GivingRecord = z.infer<typeof selectGivingRecordSchema>;

export type InsertConference = z.infer<typeof insertConferenceSchema>;
export type InsertChurch = z.infer<typeof insertChurchSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertRoleAssignment = z.infer<typeof insertRoleAssignmentSchema>;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type InsertHousehold = z.infer<typeof insertHouseholdSchema>;
export type InsertGivingBatch = z.infer<typeof insertGivingBatchSchema>;
export type InsertGivingRecord = z.infer<typeof insertGivingRecordSchema>;
