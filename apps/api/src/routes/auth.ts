import type { AppType } from "../types";
import { and, eq, isNull } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateToken, createJwt, getTokenTtlSeconds } from "@theobase/auth";
import { generateId } from "@theobase/shared";
import { getDb } from "../middleware/get-db";
import { getEmailSender } from "../middleware/get-email";
import { renderMagicLinkEmail } from "@theobase/email";

export function registerAuthRoutes(app: AppType) {
  app.post("/auth/request", async (c) => {
    const { email } = await c.req.json<{ email: string }>();
    if (!email || !email.includes("@")) {
      return c.json({ error: "Valid email required" }, 400);
    }

    const db = getDb(c);
    const token = generateToken();
    const now = new Date().toISOString();
    const ttl = getTokenTtlSeconds();
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

    await db.insert(schema.authToken).values({
      id: generateId(),
      email: email.toLowerCase(),
      token,
      expiresAt,
      createdAt: now,
    });

    const appUrl = (globalThis as any).APP_URL || "https://theobase.app";
    const magicLink = `${appUrl}/auth/verify?token=${token}`;

    const sendEmail = getEmailSender(c);
    await sendEmail({
      to: email,
      subject: "Sign in to Theobase",
      html: renderMagicLinkEmail({ magicLink }),
    });

    return c.json({ ok: true });
  });

  app.post("/auth/verify", async (c) => {
    const { token } = await c.req.json<{ token: string }>();
    if (!token) {
      return c.json({ error: "Token required" }, 400);
    }

    const db = getDb(c);
    const now = new Date().toISOString();

    const [found] = await db
      .select()
      .from(schema.authToken)
      .where(and(eq(schema.authToken.token, token), isNull(schema.authToken.usedAt)));

    if (!found || found.expiresAt < now) {
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    await db
      .update(schema.authToken)
      .set({ usedAt: now })
      .where(eq(schema.authToken.id, found.id));

    let user: typeof schema.user.$inferSelect | undefined;
    [user] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, found.email));

    if (!user) {
      const id = generateId();
      await db.insert(schema.user).values({
        id,
        email: found.email,
        createdAt: now,
      });
      user = { id, email: found.email, personId: null, congregationId: null, createdAt: now };
    }

    if (!user.congregationId) {
      let personId = user.personId;
      if (!personId) {
        const [person] = await db
          .select({ id: schema.person.id, congregationId: schema.person.congregationId })
          .from(schema.person)
          .where(eq(schema.person.email, found.email));
        if (person) {
          personId = person.id;
          await db
            .update(schema.user)
            .set({ personId: person.id, congregationId: person.congregationId })
            .where(eq(schema.user.id, user.id));
          user.personId = person.id;
          user.congregationId = person.congregationId;
        }
      }

      if (personId) {
        const [person] = await db
          .select({ congregationId: schema.person.congregationId })
          .from(schema.person)
          .where(eq(schema.person.id, personId));

        if (person?.congregationId) {
          const pendingRoles = await db
            .select()
            .from(schema.role)
            .where(and(
              eq(schema.role.congregationId, person.congregationId),
              isNull(schema.role.personId)
            ));

          for (const role of pendingRoles) {
            await db
              .update(schema.role)
              .set({ personId })
              .where(eq(schema.role.id, role.id));
          }

          if (!user.congregationId) {
            await db
              .update(schema.user)
              .set({ congregationId: person.congregationId })
              .where(eq(schema.user.id, user.id));
            user.congregationId = person.congregationId;
          }
        }
      }
    }

    const jwt = await createJwt(
      { userId: user.id, congregationId: user.congregationId ?? undefined },
      c.env.JWT_SECRET || "theobase-dev-secret-change-in-production"
    );
    c.header("Set-Cookie", `token=${jwt}; HttpOnly; Path=/; SameSite=None; Secure; Max-Age=86400`);
    return c.json({ ok: true, userId: user.id, token: jwt });
  });
}
