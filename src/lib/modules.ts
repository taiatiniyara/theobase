export interface Module {
  id: string;
  label: string;
  path: string;
  permission: string;
  roles: string[];
  icon: string;
}

export interface ModuleGroup {
  id: string;
  label: string;
  permission?: string;
  roles?: string[];
  items: Module[];
}

export const MODULE_GROUPS: ModuleGroup[] = [
  {
    id: "core",
    label: "",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        path: "/app",
        permission: "org:read",
        roles: ["sysadmin", "president", "secretary", "treasurer", "auditor", "pastor", "member"],
        icon: "home",
      },
    ],
  },
  {
    id: "management",
    label: "Management",
    permission: "org:manage",
    roles: ["sysadmin", "secretary"],
    items: [
      {
        id: "organization",
        label: "Organization",
        path: "/app/organization",
        permission: "org:read",
        roles: ["sysadmin", "secretary"],
        icon: "building",
      },
      {
        id: "users",
        label: "Users",
        path: "/app/users",
        permission: "users:invite",
        roles: ["sysadmin", "secretary"],
        icon: "users",
      },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    permission: "finance:read",
    roles: ["sysadmin", "president", "secretary", "treasurer", "auditor", "pastor"],
    items: [
      {
        id: "finance",
        label: "Finance",
        path: "/app/finance",
        permission: "finance:read",
        roles: ["sysadmin", "president", "secretary", "treasurer", "auditor", "pastor"],
        icon: "currency",
      },
      {
        id: "audit",
        label: "Audit Log",
        path: "/app/audit",
        permission: "audit:read",
        roles: ["sysadmin", "auditor", "president"],
        icon: "shield",
      },
    ],
  },
  {
    id: "membership",
    label: "Membership",
    permission: "members:read",
    roles: ["sysadmin", "president", "secretary", "treasurer", "auditor", "pastor", "member"],
    items: [
      {
        id: "members",
        label: "Members",
        path: "/app/members",
        permission: "members:read",
        roles: ["sysadmin", "president", "secretary", "treasurer", "auditor", "pastor", "member"],
        icon: "person",
      },
      {
        id: "attendance",
        label: "Attendance",
        path: "/app/attendance",
        permission: "attendance:read",
        roles: ["sysadmin", "president", "secretary", "treasurer", "auditor", "pastor", "member"],
        icon: "chart",
      },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    permission: "members:read",
    roles: ["sysadmin", "president", "secretary", "treasurer", "auditor", "pastor"],
    items: [
      {
        id: "reports",
        label: "Reports",
        path: "/app/reports",
        permission: "members:read",
        roles: ["sysadmin", "president", "secretary", "treasurer", "auditor", "pastor"],
        icon: "chart",
      },
      {
        id: "reconciliation",
        label: "Reconciliation",
        path: "/app/reconciliation",
        permission: "finance:read",
        roles: ["sysadmin", "president", "treasurer", "auditor"],
        icon: "currency",
      },
      {
        id: "conference",
        label: "Conference",
        path: "/app/conference",
        permission: "org:read",
        roles: ["sysadmin", "president", "secretary", "treasurer", "auditor"],
        icon: "building",
      },
      {
        id: "district",
        label: "My District",
        path: "/app/district",
        permission: "org:read",
        roles: ["pastor"],
        icon: "building",
      },
      {
        id: "global",
        label: "Global",
        path: "/app/global",
        permission: "org:read",
        roles: ["sysadmin", "president", "secretary", "treasurer", "auditor"],
        icon: "chart",
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    permission: "org:read",
    roles: ["sysadmin", "secretary", "treasurer", "pastor"],
    items: [
      {
        id: "settings",
        label: "Settings",
        path: "/app/settings",
        permission: "org:read",
        roles: ["sysadmin", "secretary", "treasurer", "pastor"],
        icon: "cog",
      },
    ],
  },
];

export function isModuleVisible(module: Module | ModuleGroup, userRole: string): boolean {
  return module.roles!.includes(userRole);
}

export function getVisibleGroups(userRole: string): ModuleGroup[] {
  return MODULE_GROUPS.filter((group) => {
    if (!group.roles || !isModuleVisible(group, userRole)) return false;
    const visibleItems = group.items.filter((item) => isModuleVisible(item, userRole));
    return visibleItems.length > 0;
  });
}
