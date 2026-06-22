import { registerAuthRoutes } from "./routes/auth";
import { registerMeRoutes } from "./routes/me";
import { registerReceiptRoutes } from "./routes/receipts";
import { registerBoardroomRoutes } from "./routes/boardroom";
import { registerRotaRoutes } from "./routes/rota";
import { registerTreasuryRoutes } from "./routes/treasury";
import { registerCongregationRoutes } from "./routes/congregation";
import { registerPathfinderRoutes } from "./routes/pathfinders";
import { registerSabbathSchoolRoutes } from "./routes/sabbath-school";
import { registerWelfareRoutes } from "./routes/welfare";
import { registerHealthRoutes } from "./routes/health";
import { registerHouseholdRoutes } from "./routes/households";
import { registerCommunionRoutes } from "./routes/communion";
import { registerAvRoutes } from "./routes/av";
import { registerDistrictRoutes } from "./routes/district";
import { registerFacilitiesRoutes } from "./routes/facilities";
import { registerCrisisRoutes } from "./routes/crisis";
import { registerTransferRoutes } from "./routes/transfers";
import { registerNominatingRoutes } from "./routes/nominating";
import { registerConferenceRoutes } from "./routes/conference";
import { registerDisciplineRoutes } from "./routes/discipline";
import { registerOrganizationRoutes } from "./routes/organization";
import { registerPersonRoutes } from "./routes/persons";
import { registerBillingRoutes } from "./routes/billing";
import { registerAuditRoutes } from "./routes/audit";
import { rateLimiter } from "./middleware/rate-limit";
import { securityHeaders, csrfProtection } from "./middleware/security";
import { policyGuardian } from "./middleware/policy-compliance";
import { correlationId } from "./middleware/correlation-id";
import type { Bindings, Variables } from "./types";
import { Hono } from "hono";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.onError((err, c) => {
  const correlationId = c.get("correlationId") || "unknown";
  console.error(
    JSON.stringify({
      correlation_id: correlationId,
      method: c.req.method,
      path: c.req.path,
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    })
  );
  return c.json(
    { error: "Internal server error", correlation_id: correlationId },
    500
  );
});

app.use("*", securityHeaders());
app.use("*", correlationId());

app.use("*", async (c, next) => {
  const appUrl = c.env.APP_URL || "https://theobase.app";
  const isDev =
    c.env.APP_URL === "" || new URL(appUrl).hostname === "localhost";
  const allowed = isDev
    ? ["http://localhost:5173", "http://localhost:8787"]
    : [appUrl];

  if (c.req.method === "OPTIONS") {
    const requestOrigin = c.req.header("Origin");
    const allowOrigin =
      requestOrigin && allowed.includes(requestOrigin)
        ? requestOrigin
        : allowed[0];
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  await next();
  const requestOrigin = c.req.header("Origin");
  if (requestOrigin && allowed.includes(requestOrigin)) {
    c.header("Access-Control-Allow-Origin", requestOrigin);
    c.header("Access-Control-Allow-Credentials", "true");
  }
});

app.use("*", rateLimiter(100, 60));
app.use("*", csrfProtection());
app.use("*", policyGuardian());

app.get("/health", async (c) => {
  let db = "disconnected";
  try {
    const result = await c.env.DB.prepare("SELECT 1").first();
    db = result ? "connected" : "disconnected";
  } catch {
    /* db unavailable */
  }

  let r2 = "unchecked";
  try {
    if (c.env.STORAGE) r2 = "available";
  } catch {
    r2 = "unavailable";
  }

  let durableObjects = "unchecked";
  try {
    if (c.env.CONGREGATION_DO) durableObjects = "available";
  } catch {
    durableObjects = "unavailable";
  }

  const healthy = db === "connected";
  return c.json({
    ok: healthy,
    status: healthy ? "healthy" : "degraded",
    db,
    r2,
    durableObjects,
    timestamp: new Date().toISOString(),
  });
});

registerAuthRoutes(app);
registerMeRoutes(app);
registerReceiptRoutes(app);
registerBoardroomRoutes(app);
registerRotaRoutes(app);
registerTreasuryRoutes(app);
registerCongregationRoutes(app);
registerPathfinderRoutes(app);
registerSabbathSchoolRoutes(app);
registerWelfareRoutes(app);
registerHealthRoutes(app);
registerHouseholdRoutes(app);
registerCommunionRoutes(app);
registerAvRoutes(app);
registerDistrictRoutes(app);
registerFacilitiesRoutes(app);
registerCrisisRoutes(app);
registerTransferRoutes(app);
registerNominatingRoutes(app);
registerConferenceRoutes(app);
registerDisciplineRoutes(app);
registerOrganizationRoutes(app);
registerPersonRoutes(app);
registerBillingRoutes(app);
registerAuditRoutes(app);

export default app;
