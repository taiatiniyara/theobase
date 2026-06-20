import { DurableObject } from "cloudflare:workers";
import { deriveKey, encrypt, decrypt } from "@theobase/shared";

export class NominatingDO extends DurableObject {
  private async getKey(): Promise<CryptoKey> {
    const stored = await this.ctx.storage.get<{ salt: string; keyData: string }>("encKey");
    if (stored) {
      const salt = Uint8Array.from(atob(stored.salt), c => c.charCodeAt(0));
      return deriveKey(stored.keyData, salt);
    }
    const secret = crypto.randomUUID() + crypto.randomUUID();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(secret, salt);
    await this.ctx.storage.put("encKey", {
      salt: btoa(String.fromCharCode(...salt)),
      keyData: secret,
    });
    return key;
  }

  async castBallot(sessionId: string, roleId: string, candidateId: string, voterId: string): Promise<{ ok: boolean; error?: string }> {
    const key = await this.getKey();
    const sessionKey = `ballots:${sessionId}`;
    const existing = await this.ctx.storage.get<Record<string, string>>(sessionKey) || {};

    if (existing[voterId]) {
      return { ok: false, error: "Already voted in this session" };
    }

    const vote = JSON.stringify({ roleId, candidateId, timestamp: Date.now() });
    const encrypted = await encrypt(vote, key);
    existing[voterId] = JSON.stringify(encrypted);
    await this.ctx.storage.put(sessionKey, existing);

    return { ok: true };
  }

  async getBallot(voterId: string, sessionId: string): Promise<{ voted: boolean; choice?: string }> {
    const key = await this.getKey();
    const sessionKey = `ballots:${sessionId}`;
    const existing = await this.ctx.storage.get<Record<string, string>>(sessionKey) || {};

    const encData = existing[voterId];
    if (!encData) return { voted: false };

    try {
      const parsed = JSON.parse(encData) as { ciphertext: string; iv: string };
      const decrypted = await decrypt(parsed, key);
      const vote = JSON.parse(decrypted) as { roleId: string; candidateId: string };
      return { voted: true, choice: vote.candidateId };
    } catch {
      return { voted: false };
    }
  }

  async getTally(sessionId: string): Promise<{ tally: Record<string, number>; totalVotes: number }> {
    const key = await this.getKey();
    const sessionKey = `ballots:${sessionId}`;
    const existing = await this.ctx.storage.get<Record<string, string>>(sessionKey) || {};

    const tally: Record<string, number> = {};
    let totalVotes = 0;

    for (const [, encData] of Object.entries(existing)) {
      try {
        const parsed = JSON.parse(encData) as { ciphertext: string; iv: string };
        const decrypted = await decrypt(parsed, key);
        const vote = JSON.parse(decrypted) as { candidateId: string };
        tally[vote.candidateId] = (tally[vote.candidateId] || 0) + 1;
        totalVotes++;
      } catch { /* skip corrupt entries */ }
    }

    return { tally, totalVotes };
  }

  async closeVoting(sessionId: string): Promise<{ ok: boolean }> {
    await this.ctx.storage.put(`closed:${sessionId}`, true);
    return { ok: true };
  }

  async isVotingClosed(sessionId: string): Promise<boolean> {
    return !!(await this.ctx.storage.get(`closed:${sessionId}`));
  }
}
