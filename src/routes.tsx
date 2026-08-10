import { lazy, Suspense } from "react";
import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { ToastContainer } from "./components/ui/Toast";

const HomePage = lazy(() => import("./routes/HomePage"));
const LoginPage = lazy(() => import("./routes/LoginPage"));
const SignupPage = lazy(() => import("./routes/SignupPage"));
const ForgotPasswordPage = lazy(() => import("./routes/ForgotPasswordPage"));
const VerifyEmailPage = lazy(() => import("./routes/VerifyEmailPage"));
const ResetPasswordPage = lazy(() => import("./routes/ResetPasswordPage"));
const AcceptInvitePage = lazy(() => import("./routes/AcceptInvitePage"));
const DashboardLayout = lazy(() => import("./routes/DashboardLayout"));
const DashboardPage = lazy(() => import("./routes/DashboardPage"));
const OrgManagementPage = lazy(() => import("./routes/OrgManagementPage"));
const UsersPage = lazy(() => import("./routes/UsersPage"));
const FinancePage = lazy(() => import("./routes/FinancePage"));
const MembersPage = lazy(() => import("./routes/MembersPage"));
const ReportsPage = lazy(() => import("./routes/ReportsPage"));
const SettingsPage = lazy(() => import("./routes/SettingsPage"));
const AuditPage = lazy(() => import("./routes/AuditPage"));
const ReconciliationPage = lazy(() => import("./routes/ReconciliationPage"));
const ConferenceDashboard = lazy(() => import("./routes/ConferenceDashboard"));
const DistrictDashboard = lazy(() => import("./routes/DistrictDashboard"));
const GlobalDashboard = lazy(() => import("./routes/GlobalDashboard"));
const AttendancePage = lazy(() => import("./routes/AttendancePage"));
const ContributionsPage = lazy(() => import("./routes/ContributionsPage"));
const MemberDashboardPage = lazy(() => import("./routes/MemberDashboardPage"));
const BillingPage = lazy(() => import("./routes/BillingPage"));
const AdminPage = lazy(() => import("./routes/AdminPage"));
const SabbathSchoolPage = lazy(() => import("./routes/SabbathSchoolPage"));

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );
}

const rootRoute = createRootRoute({
  component: () => (
    <Suspense fallback={<Spinner />}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[300] focus:rounded focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <div className="min-h-screen bg-gray-50">
        <Outlet />
        <ToastContainer />
      </div>
    </Suspense>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: SignupPage,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forgot-password",
  component: ForgotPasswordPage,
});

const verifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verify-email",
  component: VerifyEmailPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reset-password",
  component: ResetPasswordPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
});

const acceptInviteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/accept-invite",
  component: AcceptInvitePage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
});

const dashboardLayout = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app",
  component: DashboardLayout,
  beforeLoad: () => {
    if (!localStorage.getItem("accessToken") && !localStorage.getItem("refreshToken")) {
      throw redirect({ to: "/login" });
    }
  },
});

const dashboardIndex = createRoute({
  getParentRoute: () => dashboardLayout,
  path: "/",
  component: DashboardPage,
});

const organizationRoute = createRoute({
  getParentRoute: () => dashboardLayout,
  path: "/organization",
  component: OrgManagementPage,
});

const usersRoute = createRoute({
  getParentRoute: () => dashboardLayout,
  path: "/users",
  component: UsersPage,
});

const financeRoute = createRoute({
  getParentRoute: () => dashboardLayout,
  path: "/finance",
  component: FinancePage,
});

const membersRoute = createRoute({
  getParentRoute: () => dashboardLayout,
  path: "/members",
  component: MembersPage,
});

const reportsRoute = createRoute({
  getParentRoute: () => dashboardLayout,
  path: "/reports",
  component: ReportsPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => dashboardLayout,
  path: "/settings",
  component: SettingsPage,
});

const auditRoute = createRoute({
  getParentRoute: () => dashboardLayout,
  path: "/audit",
  component: AuditPage,
});

const reconciliationRoute = createRoute({
  getParentRoute: () => dashboardLayout,
  path: "/reconciliation",
  component: ReconciliationPage,
});

const conferenceDashboardRoute = createRoute({
  getParentRoute: () => dashboardLayout,
  path: "/conference",
  component: ConferenceDashboard,
});

const districtDashboardRoute = createRoute({
  getParentRoute: () => dashboardLayout,
  path: "/district",
  component: DistrictDashboard,
});

const globalDashboardRoute = createRoute({
  getParentRoute: () => dashboardLayout,
  path: "/global",
  component: GlobalDashboard,
});

const attendanceRoute = createRoute({
  getParentRoute: () => dashboardLayout,
  path: "/attendance",
  component: AttendancePage,
});

const contributionsRoute = createRoute({
  getParentRoute: () => dashboardLayout,
  path: "/contributions",
  component: ContributionsPage,
});

const memberDashboardRoute = createRoute({
  getParentRoute: () => dashboardLayout,
  path: "/member-dashboard",
  component: MemberDashboardPage,
});

const billingRoute = createRoute({
  getParentRoute: () => dashboardLayout,
  path: "/admin/billing",
  component: BillingPage,
});

const adminRoute = createRoute({
  getParentRoute: () => dashboardLayout,
  path: "/admin",
  component: AdminPage,
});

const sabbathSchoolRoute = createRoute({
  getParentRoute: () => dashboardLayout,
  path: "/sabbath-school",
  component: SabbathSchoolPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  forgotPasswordRoute,
  verifyEmailRoute,
  resetPasswordRoute,
  acceptInviteRoute,
  dashboardLayout.addChildren([
    dashboardIndex,
    organizationRoute,
    usersRoute,
    financeRoute,
    membersRoute,
    reportsRoute,
    settingsRoute,
    auditRoute,
    reconciliationRoute,
    conferenceDashboardRoute,
    districtDashboardRoute,
    globalDashboardRoute,
    attendanceRoute,
    contributionsRoute,
    memberDashboardRoute,
    billingRoute,
    adminRoute,
    sabbathSchoolRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
