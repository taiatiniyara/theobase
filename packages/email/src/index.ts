import { SmtpRelayClient } from "@taiatiniyara/smtp-relay-client";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
}

export interface EmailResult {
  success: boolean;
  error?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
}

export interface EmailSenderConfig {
  relayUrl: string;
  relayPin: string;
  smtp: SmtpConfig;
  from: string;
  timeout?: number;
}

export {
  renderMagicLinkEmail,
  renderRotaAssignmentEmail,
  renderInviteEmail,
} from "./template";

export function createEmailSender(config: EmailSenderConfig) {
  const relay = new SmtpRelayClient({
    url: config.relayUrl,
    pin: config.relayPin,
    timeout: config.timeout,
  });

  return async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
    const testEmails = (globalThis as Record<string, unknown>).__testEmails as
      | EmailPayload[]
      | undefined;
    if (testEmails !== undefined) {
      testEmails.push({
        ...payload,
        sentAt: new Date().toISOString(),
      } as EmailPayload & { sentAt: string });
      return { success: true };
    }

    if (!config.relayUrl || !config.relayPin) {
      console.error(
        "[email] SMTP_RELAY_URL or SMTP_RELAY_PIN not configured. Set them via: npx wrangler secret put SMTP_RELAY_URL / SMTP_RELAY_PIN"
      );
      return { success: false, error: "Email relay not configured." };
    }

    if (!config.smtp.host || !config.smtp.auth.user || !config.smtp.auth.pass) {
      console.error(
        "[email] SMTP_HOST, SMTP_USER, or SMTP_PASS not configured."
      );
      return {
        success: false,
        error: "SMTP credentials not configured.",
      };
    }

    const from = payload.fromName
      ? `${payload.fromName} <${config.from}>`
      : config.from;

    try {
      await relay.send(config.smtp, {
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
      return { success: true };
    } catch (err) {
      console.error("[email] Relay error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  };
}
