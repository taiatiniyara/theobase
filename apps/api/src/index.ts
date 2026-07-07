import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ message: "Theobase API", status: "ok" });
});

app.get("/health", (c) => {
  return c.json({ status: "healthy" });
});

export default app;
