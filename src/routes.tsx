import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import HomePage from "./routes/HomePage";
import LoginPage from "./routes/LoginPage";
import SignupPage from "./routes/SignupPage";
import ForgotPasswordPage from "./routes/ForgotPasswordPage";
import DashboardLayout from "./routes/DashboardLayout";
import DashboardPage from "./routes/DashboardPage";
import OrgManagementPage from "./routes/OrgManagementPage";
import UsersPage from "./routes/UsersPage";
import FinancePage from "./routes/FinancePage";
import MembersPage from "./routes/MembersPage";
import ReportsPage from "./routes/ReportsPage";
import SettingsPage from "./routes/SettingsPage";
import AuditPage from "./routes/AuditPage";

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
    </div>
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

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  forgotPasswordRoute,
  dashboardLayout.addChildren([
    dashboardIndex,
    organizationRoute,
    usersRoute,
    financeRoute,
    membersRoute,
    reportsRoute,
    settingsRoute,
    auditRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
