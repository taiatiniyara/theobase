import { createRootRoute, createRoute, Outlet } from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => (
    <div>
      <Outlet />
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: function Index() {
    return (
      <div>
        <h1>Theobase</h1>
        <p>Seventh-day Adventist Church information system</p>
      </div>
    );
  },
});

export const routeTree = rootRoute.addChildren([indexRoute]);
