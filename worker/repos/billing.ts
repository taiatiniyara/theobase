import { sql } from "drizzle-orm";
import type { Db as DrizzleDb } from "../lib/db";

export interface SubscriptionRow {
  id: number;
  conference_id: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  church_count: number;
  trial_ends_at: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceRow {
  id: number;
  conference_id: number;
  period_start: string;
  period_end: string;
  church_count: number;
  amount: number;
  status: string;
  stripe_invoice_id: string | null;
  created_at: string;
}

const PRICE_PER_CHURCH = 3;
const TRIAL_MONTHS = 6;

export class BillingRepo {
  constructor(private db: DrizzleDb) {}

  async createSubscription(conferenceId: number): Promise<SubscriptionRow> {
    const trialEnds = new Date();
    trialEnds.setMonth(trialEnds.getMonth() + TRIAL_MONTHS);
    const result = await this.db.get<SubscriptionRow>(
      sql`INSERT INTO subscriptions (conference_id, trial_ends_at, status)
          VALUES (${conferenceId}, ${trialEnds.toISOString()}, 'trialing')
          RETURNING *`
    );
    return result!;
  }

  async getSubscription(conferenceId: number): Promise<SubscriptionRow | undefined> {
    return this.db.get<SubscriptionRow>(
      sql`SELECT * FROM subscriptions WHERE conference_id = ${conferenceId}`
    );
  }

  async updateSubscription(
    conferenceId: number,
    data: {
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
      churchCount?: number;
      status?: string;
    }
  ): Promise<void> {
    const updates = sql`updated_at = datetime('now')`;
    if (data.stripeCustomerId !== undefined) {
      await this.db.run(
        sql`UPDATE subscriptions SET stripe_customer_id = ${data.stripeCustomerId}, ${updates} WHERE conference_id = ${conferenceId}`
      );
    }
    if (data.stripeSubscriptionId !== undefined) {
      await this.db.run(
        sql`UPDATE subscriptions SET stripe_subscription_id = ${data.stripeSubscriptionId}, ${updates} WHERE conference_id = ${conferenceId}`
      );
    }
    if (data.churchCount !== undefined) {
      await this.db.run(
        sql`UPDATE subscriptions SET church_count = ${data.churchCount}, ${updates} WHERE conference_id = ${conferenceId}`
      );
    }
    if (data.status !== undefined) {
      await this.db.run(
        sql`UPDATE subscriptions SET status = ${data.status}, ${updates} WHERE conference_id = ${conferenceId}`
      );
    }
  }

  async countChurches(conferenceId: number): Promise<number> {
    const result = await this.db.get<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM churches WHERE parent_id = ${conferenceId} AND parent_type = 'conference'`
    );
    return result?.count ?? 0;
  }

  async createInvoice(
    conferenceId: number,
    churchCount: number,
    periodStart: string,
    periodEnd: string
  ): Promise<InvoiceRow> {
    const amount = churchCount * PRICE_PER_CHURCH;
    const result = await this.db.get<InvoiceRow>(
      sql`INSERT INTO invoices (conference_id, period_start, period_end, church_count, amount)
          VALUES (${conferenceId}, ${periodStart}, ${periodEnd}, ${churchCount}, ${amount})
          RETURNING *`
    );
    return result!;
  }

  async getInvoices(conferenceId: number): Promise<InvoiceRow[]> {
    return this.db.all<InvoiceRow>(
      sql`SELECT * FROM invoices WHERE conference_id = ${conferenceId} ORDER BY created_at DESC`
    );
  }

  async getAllActiveSubscriptions(): Promise<SubscriptionRow[]> {
    return this.db.all<SubscriptionRow>(
      sql`SELECT * FROM subscriptions WHERE status IN ('trialing', 'active', 'past_due')`
    );
  }

  async getSubscriptionByStripeCustomer(customerId: string): Promise<SubscriptionRow | undefined> {
    return this.db.get<SubscriptionRow>(
      sql`SELECT * FROM subscriptions WHERE stripe_customer_id = ${customerId}`
    );
  }
}
