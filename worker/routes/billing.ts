import Stripe from "stripe";
import { type AuthContext } from "../lib/middleware";
import { createDb } from "../lib/db";
import { BillingRepo } from "../repos/billing";
import { json } from "../lib/response";

function getStripe(env: Env): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) return null;
  return new Stripe(env.STRIPE_SECRET_KEY);
}

export async function handleCreateCheckout(
  request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const stripe = getStripe(env);
  if (!stripe) {
    return json({ error: "Billing not configured" }, 500);
  }

  const db = createDb(env);
  const repo = new BillingRepo(db);

  const sub = await repo.getSubscription(Number(auth.conferenceId));
  if (!sub) {
    return json({ error: "No subscription found" }, 404);
  }

  if (sub.status === "active") {
    return json({ error: "Subscription already active" }, 400);
  }

  const customer = await stripe.customers.create({
    email: `${auth.userId}@theobase.app`,
    metadata: { conferenceId: String(sub.conference_id) },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    line_items: [
      {
        price: env.STRIPE_PRICE_ID,
        quantity: Math.max(1, sub.church_count),
      },
    ],
    success_url: `${request.headers.get("origin") || "https://theobase.app"}/app/admin/billing?success=true`,
    cancel_url: `${request.headers.get("origin") || "https://theobase.app"}/app/admin/billing?canceled=true`,
    metadata: { conferenceId: String(sub.conference_id) },
  });

  await repo.updateSubscription(sub.conference_id, {
    stripeCustomerId: customer.id,
  });

  return json({ url: session.url });
}

export async function handleStripeWebhook(request: Request, env: Env): Promise<Response> {
  const stripe = getStripe(env);
  if (!stripe) {
    return json({ error: "Billing not configured" }, 500);
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig || !env.STRIPE_WEBHOOK_SECRET) {
    return json({ error: "Missing signature" }, 400);
  }

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return json({ error: "Invalid signature" }, 400);
  }

  const db = createDb(env);
  const repo = new BillingRepo(db);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const conferenceId = Number(session.metadata?.conferenceId);
    if (conferenceId) {
      await repo.updateSubscription(conferenceId, {
        stripeSubscriptionId: session.subscription as string,
        status: "active",
      });
    }
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = invoice.customer as string;
    const sub = await repo.getSubscriptionByStripeCustomer(customerId);
    if (sub) {
      await repo.updateSubscription(sub.conference_id, { status: "active" });
    }
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = invoice.customer as string;
    const sub = await repo.getSubscriptionByStripeCustomer(customerId);
    if (sub && sub.status === "active") {
      await repo.updateSubscription(sub.conference_id, { status: "past_due" });
    }
  }

  return json({ received: true });
}

export async function handleBillingStatus(
  _request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const db = createDb(env);
  const repo = new BillingRepo(db);

  const sub = await repo.getSubscription(Number(auth.conferenceId));
  if (!sub) {
    return json({ error: "No subscription" }, 404);
  }

  const invoices = await repo.getInvoices(sub.conference_id);

  return json({
    subscription: {
      id: sub.id,
      status: sub.status,
      churchCount: sub.church_count,
      trialEndsAt: sub.trial_ends_at,
    },
    invoices: invoices.map((inv) => ({
      id: inv.id,
      periodStart: inv.period_start,
      periodEnd: inv.period_end,
      churchCount: inv.church_count,
      amount: inv.amount,
      status: inv.status,
    })),
  });
}

export async function handleBillingAdmin(
  _request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  if (auth.role !== "sysadmin") {
    return json({ error: "Unauthorized" }, 403);
  }

  const db = createDb(env);
  const repo = new BillingRepo(db);

  const subs = await repo.getAllActiveSubscriptions();

  return json({
    subscriptions: subs.map((s) => ({
      id: s.id,
      conferenceId: s.conference_id,
      status: s.status,
      churchCount: s.church_count,
      trialEndsAt: s.trial_ends_at,
    })),
  });
}
