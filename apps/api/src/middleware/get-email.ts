import { createEmailSender } from "@theobase/email";

export function getEmailSender(c: any) {
  const env = c.env as { SMTP_RELAY_URL?: string; SMTP_RELAY_TOKEN?: string };

  return createEmailSender({
    relayUrl: env.SMTP_RELAY_URL || "",
    relayToken: env.SMTP_RELAY_TOKEN || "",
  });
}
