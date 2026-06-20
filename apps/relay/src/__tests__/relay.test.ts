import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createRelayServer } from "../index.js";
import http from "node:http";

function post(port: number, path: string, token: string, body?: Record<string, string>): Promise<{ status: number; data: unknown }> {
  const payload = body ? JSON.stringify(body) : undefined;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (payload) {
    headers["Content-Type"] = "application/json";
    headers["Content-Length"] = Buffer.byteLength(payload).toString();
  }

  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: "127.0.0.1", port, path, method: payload ? "POST" : "GET", headers },
      (res) => {
        let data = "";
        res.on("data", (chunk: string) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode || 0, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode || 0, data: data || null });
          }
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function postAuth(port: number, token: string, body?: Record<string, string>): Promise<{ status: number; data: unknown }> {
  const payload = body ? JSON.stringify(body) : "{}";
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload).toString() };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const req = http.request({ hostname: "127.0.0.1", port, path: "/", method: "POST", headers }, (res) => {
      let data = "";
      res.on("data", (chunk: string) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode || 0, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode || 0, data: data || null });
        }
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

describe("SMTP Relay", () => {
  let server: http.Server;
  let port: number;

  beforeAll(async () => {
    server = createRelayServer({
      relayToken: "test-token",
      smtpHost: "localhost",
      smtpPort: 2587,
      smtpUser: "test@example.com",
      smtpPass: "test-pass",
    });
    await new Promise<void>((resolve) => server.listen(0, () => resolve()));
    port = (server.address() as { port: number }).port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  describe("GET /health", () => {
    it("returns ok status", async () => {
      const { status, data } = await post(port, "/health", "");
      expect(status).toBe(200);
      expect(data).toEqual({ status: "ok" });
    });
  });

  describe("authentication", () => {
    it("returns 401 without auth header", async () => {
      const { status } = await postAuth(port, "");
      expect(status).toBe(401);
    });

    it("returns 401 with wrong token", async () => {
      const { status } = await postAuth(port, "wrong-token");
      expect(status).toBe(401);
    });

    it("rejects non-POST methods", async () => {
      const res: { status: number } = await new Promise((resolve, reject) => {
        const req = http.request({ hostname: "127.0.0.1", port, path: "/", method: "PUT" }, (res) => {
          let data = "";
          res.on("data", (chunk: string) => (data += chunk));
          res.on("end", () => resolve({ status: res.statusCode || 0 }));
        });
        req.on("error", reject);
        req.end();
      });
      expect(res.status).toBe(405);
    });
  });

  describe("POST /", () => {
    it("returns 500 for invalid JSON body", async () => {
      const res: { status: number } = await new Promise((resolve, reject) => {
        const req = http.request(
          {
            hostname: "127.0.0.1", port, path: "/", method: "POST",
            headers: { Authorization: "Bearer test-token", "Content-Type": "application/json" },
          },
          (res) => {
            let data = "";
            res.on("data", (chunk: string) => (data += chunk));
            res.on("end", () => resolve({ status: res.statusCode || 0 }));
          }
        );
        req.on("error", reject);
        req.write("not json");
        req.end();
      });
      expect(res.status).toBe(500);
    });

    it("returns 500 for valid request to non-existent SMTP server", async () => {
      const { status, data } = await post(port, "/", "test-token", {
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>Hello</p>",
      });
      expect(status).toBe(500);
      expect((data as Record<string, string>).error).toBe("Failed to send email");
    });
  });
});
