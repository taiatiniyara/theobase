import { requireAuth } from "@theobase/auth";
import { getDb } from "../middleware/get-db";
import { loadRoles } from "../middleware/load-roles";
import { recordAudit } from "../middleware/audit";
import { generateId } from "@theobase/shared";
import { subscriptionPlan, subscription, webhookEvent } from "@theobase/db";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import type { AppType } from "../types";

function getStripe(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia",
    httpClient: Stripe.createFetchHttpClient(),
    maxNetworkRetries: 3,
  });
}

const WEBHOOK_SIGNATURE_HEADER = "stripe-signature";

function stripeDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString();
}

export function registerBillingRoutes(app: AppType) {
  app.get("/billing/plans", requireAuth(), loadRoles(), async (c) => {
    const db = getDb(c);
    const plans = await db
      .select()
      .from(subscriptionPlan)
      .where(eq(subscriptionPlan.active, true))
      .orderBy(subscriptionPlan.sortOrder);
    return c.json(plans);
  });

  app.get("/billing/subscription", requireAuth(), loadRoles(), async (c) => {
    const congregationId = c.get("congregationId");
    if (!congregationId) {
      return c.json({ error: "No congregation" }, 400);
    }
    const db = getDb(c);
    const [sub] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.congregationId, congregationId))
      .limit(1);
    if (!sub) {
      return c.json(null);
    }
    return c.json(sub);
  });

  app.post("/billing/checkout", requireAuth(), loadRoles(), async (c) => {
    const congregationId = c.get("congregationId");
    if (!congregationId) {
      return c.json({ error: "No congregation" }, 400);
    }
    const roles: string[] = c.get("userRoles") || [];
    if (!roles.includes("clerk") && !roles.includes("treasurer")) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const body = await c.req.json();
    const planId = body.planId as string | undefined;
    if (!planId) {
      return c.json({ error: "planId is required" }, 400);
    }

    const db = getDb(c);
    const [plan] = await db
      .select()
      .from(subscriptionPlan)
      .where(eq(subscriptionPlan.id, planId))
      .limit(1);
    if (!plan) {
      return c.json({ error: "Plan not found" }, 404);
    }

    const [existingSub] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.congregationId, congregationId))
      .limit(1);

    const stripeKey = c.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return c.json({ error: "Stripe not configured" }, 500);
    }
    const stripe = getStripe(stripeKey);

    let customerId = existingSub?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { congregationId },
      });
      customerId = customer.id;
    }

    const appUrl = c.env.APP_URL || "https://theobase.app";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      ui_mode: "embedded",
      return_url: `${appUrl}/billing?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        congregationId,
        planId: plan.id,
      },
      subscription_data: {
        metadata: {
          congregationId,
          planId: plan.id,
        },
      },
    });

    await recordAudit(db, c.get("userId"), congregationId, {
      action: "billing_checkout_created",
      resourceType: "subscription",
      resourceId: session.id,
      details: JSON.stringify({ planId: plan.id }),
    });

    return c.json({ clientSecret: session.client_secret });
  });

  app.post("/billing/portal", requireAuth(), loadRoles(), async (c) => {
    const congregationId = c.get("congregationId");
    if (!congregationId) {
      return c.json({ error: "No congregation" }, 400);
    }
    const roles: string[] = c.get("userRoles") || [];
    if (!roles.includes("clerk") && !roles.includes("treasurer")) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const db = getDb(c);
    const [sub] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.congregationId, congregationId))
      .limit(1);

    if (!sub) {
      return c.json({ error: "No subscription found" }, 404);
    }

    const stripeKey = c.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return c.json({ error: "Stripe not configured" }, 500);
    }
    const stripe = getStripe(stripeKey);

    const appUrl = c.env.APP_URL || "https://theobase.app";
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${appUrl}/billing`,
    });

    return c.json({ url: session.url });
  });

  app.post("/billing/webhook", async (c) => {
    const stripeKey = c.env.STRIPE_SECRET_KEY;
    const webhookSecret = c.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeKey || !webhookSecret) {
      console.error("Stripe webhook: secrets not configured");
      return c.json({ error: "Not configured" }, 500);
    }

    const signature = c.req.header(WEBHOOK_SIGNATURE_HEADER);
    if (!signature) {
      return c.json({ error: "Missing signature header" }, 400);
    }

    const body = await c.req.text();
    const stripe = getStripe(stripeKey);

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch {
      console.error("Stripe webhook: signature verification failed");
      return c.json({ error: "Invalid signature" }, 400);
    }

    const db = getDb(c);

    const existing = await db
      .select({ id: webhookEvent.id })
      .from(webhookEvent)
      .where(eq(webhookEvent.stripeEventId, event.id))
      .limit(1);

    if (existing.length > 0) {
      return c.json({ received: true });
    }

    await db.insert(webhookEvent).values({
      id: generateId(),
      stripeEventId: event.id,
      eventType: event.type,
      processedAt: new Date().toISOString(),
    });

    const now = new Date().toISOString();

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.mode !== "subscription") break;
          const { congregationId, planId } = session.metadata || {};
          if (!congregationId) {
            console.error(
              "Stripe webhook: checkout.session.completed missing congregationId"
            );
            break;
          }

          const stripeSubId = session.subscription as string;
          const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);

          const [existing] = await db
            .select()
            .from(subscription)
            .where(eq(subscription.congregationId, congregationId))
            .limit(1);

          const subValues = {
            stripeSubscriptionId: stripeSub.id,
            stripeCustomerId: stripeSub.customer as string,
            planId: planId || existing?.planId || null,
            status: stripeSub.status as any,
            currentPeriodStart: stripeDate(stripeSub.current_period_start),
            currentPeriodEnd: stripeDate(stripeSub.current_period_end),
            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            canceledAt: stripeSub.canceled_at
              ? stripeDate(stripeSub.canceled_at)
              : null,
            trialEnd: stripeSub.trial_end
              ? stripeDate(stripeSub.trial_end)
              : null,
            updatedAt: now,
          };

          if (existing) {
            await db
              .update(subscription)
              .set(subValues)
              .where(eq(subscription.congregationId, congregationId));
          } else {
            await db.insert(subscription).values({
              id: generateId(),
              congregationId,
              ...subValues,
              createdAt: now,
            });
          }
          break;
        }

        case "customer.subscription.updated":
        case "customer.subscription.deleted":
        case "customer.subscription.paused": {
          const stripeSub = event.data.object as Stripe.Subscription;
          const congregationId = stripeSub.metadata?.congregationId;
          if (!congregationId) {
            console.error(
              `Stripe webhook: ${event.type} missing congregationId in subscription metadata`
            );
            break;
          }

          await db
            .update(subscription)
            .set({
              status: stripeSub.status as any,
              currentPeriodStart: stripeDate(stripeSub.current_period_start),
              currentPeriodEnd: stripeDate(stripeSub.current_period_end),
              cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
              canceledAt: stripeSub.canceled_at
                ? stripeDate(stripeSub.canceled_at)
                : null,
              trialEnd: stripeSub.trial_end
                ? stripeDate(stripeSub.trial_end)
                : null,
              updatedAt: now,
            })
            .where(eq(subscription.congregationId, congregationId));
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const stripeSubId = invoice.subscription as string;
          if (!stripeSubId) break;
          const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
          const congregationId = stripeSub.metadata?.congregationId;
          if (!congregationId) break;

          await db
            .update(subscription)
            .set({
              status: stripeSub.status as any,
              updatedAt: now,
            })
            .where(eq(subscription.congregationId, congregationId));

          console.error(
            JSON.stringify({
              event: "invoice.payment_failed",
              congregationId,
              stripeSubscriptionId: stripeSubId,
              timestamp: now,
            })
          );
          break;
        }

        case "customer.subscription.trial_will_end": {
          const stripeSub = event.data.object as Stripe.Subscription;
          const congregationId = stripeSub.metadata?.congregationId;
          if (!congregationId) break;

          console.log(
            JSON.stringify({
              event: "trial_will_end",
              congregationId,
              trialEnd: stripeDate(stripeSub.trial_end!),
              timestamp: now,
            })
          );
          break;
        }
      }
    } catch (err: any) {
      console.error(
        JSON.stringify({
          error: "webhook processing failed",
          eventType: event.type,
          eventId: event.id,
          message: err.message,
          stack: err.stack,
          timestamp: now,
        })
      );
      return c.json({ error: "Webhook processing failed" }, 500);
    }

    return c.json({ received: true });
  });
}
