import http from "node:http";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";

export function createRelayServer(options = {}) {
  const RELAY_TOKEN = options.relayToken || process.env.RELAY_TOKEN || "theobase-relay-dev-token";

  const transporter = nodemailer.createTransport({
    host: options.smtpHost || process.env.SMTP_HOST || "smtp.hostinger.com",
    port: options.smtpPort || parseInt(process.env.SMTP_PORT || "465"),
    secure: true,
    auth: {
      user: options.smtpUser || process.env.SMTP_USER || "messenger@theobase.net",
      pass: options.smtpPass || process.env.SMTP_PASS,
    },
  });

  return http.createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    if (req.method !== "POST") {
      res.writeHead(405);
      res.end("Method not allowed");
      return;
    }

    const auth = req.headers.authorization;
    if (!auth || auth !== `Bearer ${RELAY_TOKEN}`) {
      res.writeHead(401);
      res.end("Unauthorized");
      return;
    }

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { to, subject, html } = JSON.parse(body);
        await transporter.sendMail({
          from: `"Theobase" <${options.smtpUser || process.env.SMTP_USER}>`,
          to,
          subject,
          html,
        });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        console.error("SMTP relay error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to send email" }));
      }
    });
  });
}

const PORT = parseInt(process.env.PORT || "3113");

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  const server = createRelayServer();
  server.listen(PORT, () => {
    console.log(`SMTP relay listening on port ${PORT}`);
  });
}
