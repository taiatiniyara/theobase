import { PERMISSIONS as SHARED_PERMISSIONS } from "../../shared/types/index";
export type Role =
  "sysadmin" | "president" | "secretary" | "treasurer" | "auditor" | "pastor" | "member";

export const PERMISSIONS: Record<string, Role[]> = SHARED_PERMISSIONS as Record<string, Role[]>;

export const ROLES = {
  sysadmin: "sysadmin",
  president: "president",
  secretary: "secretary",
  treasurer: "treasurer",
  auditor: "auditor",
  pastor: "pastor",
  member: "member",
} as const;

export const ROLE_LABELS: Record<string, string> = {
  sysadmin: "System Admin",
  president: "Conference President",
  secretary: "Conference Secretary",
  treasurer: "Conference Treasurer",
  auditor: "Conference Auditor",
  pastor: "District Pastor",
  member: "Church Member",
};

export const CONFERENCE_ROLES: string[] = [
  "sysadmin",
  "president",
  "secretary",
  "treasurer",
  "auditor",
];

export const CHURCH_ROLES: string[] = ["pastor", "member"];
