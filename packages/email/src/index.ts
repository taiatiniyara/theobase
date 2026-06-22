export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export interface EmailResult {
  success: boolean;
  error?: string;
}

export {
  renderMagicLinkEmail,
  renderRotaAssignmentEmail,
  renderInviteEmail,
} from "./template";

export function createEmailSender(config: {
  relayUrl: string;
  relayToken: string;
}) {
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

    if (!config.relayUrl || !config.relayToken) {
      console.error(
        "[email] SMTP_RELAY_URL or SMTP_RELAY_TOKEN not configured. Set them via: npx wrangler secret put SMTP_RELAY_URL / SMTP_RELAY_TOKEN"
      );
      return { success: false, error: "Email relay not configured." };
    }

    try {
      const res = await fetch(config.relayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.relayToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("[email] Relay returned", res.status, body);
        return { success: false, error: `Relay returned ${res.status}` };
      }
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
