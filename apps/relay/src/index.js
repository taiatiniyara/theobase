import http from "node:http";
import nodemailer from "nodemailer";

const PORT = parseInt(process.env.PORT || "3113");
const RELAY_TOKEN = process.env.RELAY_TOKEN || "theobase-relay-dev-token";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || "messenger@theobase.net",
    pass: process.env.SMTP_PASS,
  },
});

const server = http.createServer(async (req, res) => {
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
        from: `"Theobase" <${process.env.SMTP_USER}>`,
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

server.listen(PORT, () => {
  console.log(`SMTP relay listening on port ${PORT}`);
});
