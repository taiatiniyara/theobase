import { createEmailSender, type EmailPayload } from "@theobase/email";
import { getDb } from "./get-db";
import { eq } from "drizzle-orm";
import * as schema from "@theobase/db";

export async function getEmailSender(c: any) {
  const env = c.env as {
    SMTP_RELAY_URL?: string;
    SMTP_RELAY_PIN?: string;
    SMTP_HOST?: string;
    SMTP_PORT?: string;
    SMTP_USER?: string;
    SMTP_PASS?: string;
    SMTP_FROM?: string;
  };

  const baseSender = createEmailSender({
    relayUrl: env.SMTP_RELAY_URL || "",
    relayPin: env.SMTP_RELAY_PIN || "",
    smtp: {
      host: env.SMTP_HOST || "",
      port: parseInt(env.SMTP_PORT || "465"),
      secure: true,
      auth: {
        user: env.SMTP_USER || "",
        pass: env.SMTP_PASS || "",
      },
    },
    from: env.SMTP_FROM || "",
  });

  let congregationName = "";
  const congregationId = c.get("congregationId");
  if (congregationId) {
    try {
      const db = getDb(c);
      const [row] = await db
        .select({ name: schema.congregation.name })
        .from(schema.congregation)
        .where(eq(schema.congregation.id, congregationId));
      if (row) congregationName = row.name || "";
    } catch {
      /* lookup failed, send without congregation name */
    }
  }

  return async function sendEmail(payload: EmailPayload) {
    return baseSender({
      ...payload,
      fromName: payload.fromName || congregationName,
    });
  };
}
