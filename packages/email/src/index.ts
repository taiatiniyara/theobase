export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export function createEmailSender(config: { relayUrl: string; relayToken: string }) {
  return async function sendEmail(payload: EmailPayload): Promise<void> {
    if ((globalThis as any).__testEmails !== undefined) {
      (globalThis as any).__testEmails.push({ ...payload, sentAt: new Date().toISOString() });
      return;
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
        console.error("[email] Relay returned", res.status, await res.text());
      }
    } catch (err) {
      console.error("[email] Relay error:", err);
    }
  };
}
