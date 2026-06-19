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
import type { Bindings, Variables } from "./types";
import { Hono } from "hono";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", async (c, next) => {
  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  await next();
  c.header("Access-Control-Allow-Origin", "*");
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

export default app;
