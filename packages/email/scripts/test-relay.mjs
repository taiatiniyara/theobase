import { SmtpRelayClient } from "@taiatiniyara/smtp-relay-client";

const relay = new SmtpRelayClient({
  url: process.env.SMTP_RELAY_URL || "https://relay.theobase.net",
  pin: process.env.SMTP_RELAY_PIN || "130196",
  timeout: 15_000,
});

const user = process.env.SMTP_USER || "messenger@theobase.net";
const to = process.env.TEST_EMAIL || "taiatiniyara@gmail.com";

if (!process.env.SMTP_RELAY_URL || !process.env.SMTP_RELAY_PIN) {
  console.error("Missing SMTP_RELAY_URL or SMTP_RELAY_PIN");
  process.exit(1);
}
if (!process.env.SMTP_HOST || !user || !process.env.SMTP_PASS) {
  console.error("Missing SMTP_HOST, SMTP_USER, or SMTP_PASS");
  process.exit(1);
}

try {
  const result = await relay.send(
    {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: true,
      auth: { user, pass: process.env.SMTP_PASS || "-%cI3FMV-kTn^p7o*K}2" },
    },
    {
      from: user,
      to,
      subject: "Relay test from Theobase",
      html: "<p>If you see this, the email relay works.</p>",
    }
  );
  console.log("OK:", JSON.stringify(result));
} catch (err) {
  console.error("FAIL:", err.message);
  process.exit(1);
}
