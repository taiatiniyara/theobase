export const ROLES = {
  sysadmin: "sysadmin",
  president: "president",
  secretary: "secretary",
  treasurer: "treasurer",
  auditor: "auditor",
  pastor: "pastor",
  member: "member",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  sysadmin: "System Admin",
  president: "Conference President",
  secretary: "Conference Secretary",
  treasurer: "Conference Treasurer",
  auditor: "Conference Auditor",
  pastor: "District Pastor",
  member: "Church Member",
};

export const CONFERENCE_ROLES: Role[] = [
  ROLES.sysadmin,
  ROLES.president,
  ROLES.secretary,
  ROLES.treasurer,
  ROLES.auditor,
];

export const CHURCH_ROLES: Role[] = [ROLES.pastor, ROLES.member];

export const PERMISSIONS: Record<string, Role[]> = {
  "org:manage": [ROLES.sysadmin],
  "org:read": [
    ROLES.sysadmin,
    ROLES.president,
    ROLES.secretary,
    ROLES.treasurer,
    ROLES.auditor,
    ROLES.pastor,
    ROLES.member,
  ],
  "members:write": [ROLES.sysadmin, ROLES.secretary, ROLES.pastor],
  "members:read": [
    ROLES.sysadmin,
    ROLES.president,
    ROLES.secretary,
    ROLES.treasurer,
    ROLES.auditor,
    ROLES.pastor,
    ROLES.member,
  ],
  "finance:write": [ROLES.sysadmin, ROLES.treasurer],
  "finance:read": [
    ROLES.sysadmin,
    ROLES.president,
    ROLES.secretary,
    ROLES.treasurer,
    ROLES.auditor,
    ROLES.pastor,
  ],
  "audit:read": [ROLES.sysadmin, ROLES.auditor, ROLES.president],
  "users:invite": [ROLES.sysadmin, ROLES.secretary],
  "attendance:write": [ROLES.sysadmin, ROLES.secretary, ROLES.pastor],
  "attendance:read": [
    ROLES.sysadmin,
    ROLES.president,
    ROLES.secretary,
    ROLES.treasurer,
    ROLES.auditor,
    ROLES.pastor,
    ROLES.member,
  ],
};
