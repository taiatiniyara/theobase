const routeLabels: Record<string, string> = {
  "/app": "Dashboard",
  "/app/organization": "Organization",
  "/app/users": "Users",
  "/app/finance": "Finance",
  "/app/members": "Members",
  "/app/reports": "Reports",
  "/app/settings": "Settings",
  "/app/audit": "Audit Log",
  "/app/reconciliation": "Reconciliation",
  "/app/conference": "Conference Dashboard",
  "/app/district": "District Dashboard",
  "/app/global": "Global Dashboard",
  "/app/attendance": "Attendance",
  "/app/contributions": "Contributions",
  "/app/member-dashboard": "My Profile",
  "/app/admin/billing": "Billing",
  "/app/admin": "Admin",
};

export function getBreadcrumbs(pathname: string): { label: string; to?: string }[] {
  if (pathname === "/app") return [];

  const crumbs: { label: string; to?: string }[] = [
    {
      label: "Dashboard",
      to: "/app",
    },
  ];

  const label = routeLabels[pathname];
  if (label) {
    crumbs.push({ label });
  }

  return crumbs;
}
