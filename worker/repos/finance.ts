import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import type { Db } from "../lib/db";
import {
  funds,
  expenseCategories,
  offeringBatches,
  transactions,
  budgets,
  budgetTemplates,
} from "../schema/finance";

export type FundRow = typeof funds.$inferSelect;
export type ExpenseCategoryRow = typeof expenseCategories.$inferSelect;
export type BatchRow = typeof offeringBatches.$inferSelect;
export type TransactionRow = typeof transactions.$inferSelect;
export type BudgetRow = typeof budgets.$inferSelect;
export type BudgetTemplateRow = typeof budgetTemplates.$inferSelect;

export interface BatchTransaction extends TransactionRow {
  fundName: string;
}

export class FundRepo {
  constructor(private db: Db) {}

  async create(data: {
    name: string;
    type: string;
    forwardingRule: string;
    conferenceId: number;
  }): Promise<FundRow> {
    return this.db
      .insert(funds)
      .values({
        name: data.name,
        type: data.type,
        forwardingRule: data.forwardingRule,
        conferenceId: data.conferenceId,
      })
      .returning()
      .get();
  }

  async findAll(conferenceId?: number): Promise<FundRow[]> {
    const query = this.db.select().from(funds);
    if (conferenceId !== undefined) {
      return query.where(eq(funds.conferenceId, conferenceId)).orderBy(funds.name).all();
    }
    return query.orderBy(funds.name).all();
  }

  async findById(id: number): Promise<FundRow | undefined> {
    return this.db.select().from(funds).where(eq(funds.id, id)).get();
  }
}

export class ExpenseCategoryRepo {
  constructor(private db: Db) {}

  async create(data: { name: string; conferenceId: number }): Promise<ExpenseCategoryRow> {
    return this.db
      .insert(expenseCategories)
      .values({
        name: data.name,
        conferenceId: data.conferenceId,
      })
      .returning()
      .get();
  }

  async findAll(conferenceId?: number, active?: boolean): Promise<ExpenseCategoryRow[]> {
    const conditions = [];
    if (conferenceId !== undefined) {
      conditions.push(eq(expenseCategories.conferenceId, conferenceId));
    }
    if (active !== undefined) {
      conditions.push(eq(expenseCategories.active, active ? 1 : 0));
    }

    const query = this.db.select().from(expenseCategories);
    if (conditions.length > 0) {
      return query
        .where(and(...conditions))
        .orderBy(expenseCategories.name)
        .all();
    }
    return query.orderBy(expenseCategories.name).all();
  }

  async findById(id: number): Promise<ExpenseCategoryRow | undefined> {
    return this.db.select().from(expenseCategories).where(eq(expenseCategories.id, id)).get();
  }

  async update(
    id: number,
    data: { name?: string; active?: boolean }
  ): Promise<ExpenseCategoryRow | undefined> {
    const setData: Record<string, unknown> = {};
    if (data.name !== undefined) setData.name = data.name;
    if (data.active !== undefined) setData.active = data.active ? 1 : 0;
    if (Object.keys(setData).length === 0) return this.findById(id);

    await this.db
      .update(expenseCategories)
      .set(setData as never)
      .where(eq(expenseCategories.id, id))
      .run();

    return this.findById(id);
  }
}

export class BatchRepo {
  constructor(private db: Db) {}

  async create(data: {
    churchId: number;
    sabbathDate: string;
    submittedBy?: number;
  }): Promise<BatchRow> {
    return this.db
      .insert(offeringBatches)
      .values({
        churchId: data.churchId,
        sabbathDate: data.sabbathDate,
        submittedBy: data.submittedBy ?? null,
        submittedAt: data.submittedBy ? sql`datetime('now')` : null,
      } as never)
      .returning()
      .get();
  }

  async findById(id: number): Promise<BatchRow | undefined> {
    return this.db.select().from(offeringBatches).where(eq(offeringBatches.id, id)).get();
  }

  async findAll(churchId?: number, status?: string): Promise<BatchRow[]> {
    const conditions = [];
    if (churchId !== undefined) {
      conditions.push(eq(offeringBatches.churchId, churchId));
    }
    if (status !== undefined) {
      conditions.push(eq(offeringBatches.status, status));
    }

    const query = this.db.select().from(offeringBatches);
    if (conditions.length > 0) {
      return query
        .where(and(...conditions))
        .orderBy(desc(offeringBatches.sabbathDate))
        .all();
    }
    return query.orderBy(desc(offeringBatches.sabbathDate)).all();
  }

  async confirmFirst(batchId: number, userId: number): Promise<void> {
    await this.db.run(
      sql`UPDATE offering_batches SET
        confirmed_by_1 = ${userId},
        confirmed_at_1 = datetime('now')
        WHERE id = ${batchId}`
    );
  }

  async confirmSecond(batchId: number, userId: number): Promise<void> {
    await this.db.run(
      sql`UPDATE offering_batches SET
        confirmed_by_2 = ${userId},
        confirmed_at_2 = datetime('now'),
        status = 'confirmed'
        WHERE id = ${batchId}`
    );
  }

  async getBatchTransactions(batchId: number): Promise<BatchTransaction[]> {
    return this.db.all(
      sql`SELECT t.*, f.name AS "fundName"
        FROM transactions t
        JOIN funds f ON t.fund_id = f.id
        WHERE t.batch_id = ${batchId}
        ORDER BY t.created_at DESC`
    ) as Promise<BatchTransaction[]>;
  }
}

export class TransactionRepo {
  constructor(private db: Db) {}

  async createIncome(data: {
    churchId: number;
    fundId: number;
    amount: number;
    description?: string;
    createdBy: number;
    uuid: string;
    memberId?: number;
    envelopeNumber?: number;
    proxyForMemberId?: number;
  }): Promise<TransactionRow> {
    return this.db
      .insert(transactions)
      .values({
        churchId: data.churchId,
        fundId: data.fundId,
        type: "income",
        amount: data.amount,
        description: data.description ?? null,
        createdBy: data.createdBy,
        uuid: data.uuid,
        memberId: data.memberId ?? null,
        envelopeNumber: data.envelopeNumber ?? null,
        proxyForMemberId: data.proxyForMemberId ?? null,
      })
      .returning()
      .get();
  }

  async createExpense(data: {
    churchId: number;
    fundId: number;
    amount: number;
    description?: string;
    categoryId?: number;
    createdBy: number;
    uuid: string;
  }): Promise<TransactionRow> {
    return this.db
      .insert(transactions)
      .values({
        churchId: data.churchId,
        fundId: data.fundId,
        type: "expense",
        amount: data.amount,
        description: data.description ?? null,
        categoryId: data.categoryId ?? null,
        createdBy: data.createdBy,
        uuid: data.uuid,
      })
      .returning()
      .get();
  }

  async createForward(data: {
    churchId: number;
    fundId: number;
    amount: number;
    createdBy: number;
    uuid: string;
  }): Promise<TransactionRow> {
    return this.db
      .insert(transactions)
      .values({
        churchId: data.churchId,
        fundId: data.fundId,
        type: "forward",
        amount: data.amount,
        createdBy: data.createdBy,
        uuid: data.uuid,
      })
      .returning()
      .get();
  }

  async findAll(
    filters: {
      churchId?: number;
      fundId?: number;
      type?: string;
      batchId?: number;
      from?: string;
      to?: string;
    } = {}
  ): Promise<TransactionRow[]> {
    const conditions = [];
    if (filters.churchId !== undefined) {
      conditions.push(eq(transactions.churchId, filters.churchId));
    }
    if (filters.fundId !== undefined) {
      conditions.push(eq(transactions.fundId, filters.fundId));
    }
    if (filters.type !== undefined) {
      conditions.push(eq(transactions.type, filters.type));
    }
    if (filters.batchId !== undefined) {
      conditions.push(eq(transactions.batchId, filters.batchId));
    }
    if (filters.from !== undefined) {
      conditions.push(gte(transactions.createdAt, filters.from));
    }
    if (filters.to !== undefined) {
      conditions.push(lte(transactions.createdAt, filters.to));
    }

    const query = this.db.select().from(transactions);
    if (conditions.length > 0) {
      return query
        .where(and(...conditions))
        .orderBy(desc(transactions.createdAt))
        .all();
    }
    return query.orderBy(desc(transactions.createdAt)).all();
  }

  async findByBatch(batchId: number): Promise<TransactionRow[]> {
    return this.db.select().from(transactions).where(eq(transactions.batchId, batchId)).all();
  }

  async confirmTransactions(batchId: number, userId: number, confirmedAt: string): Promise<void> {
    await this.db.run(
      sql`UPDATE transactions SET
        confirmed_by = ${userId},
        confirmed_at = ${confirmedAt}
        WHERE batch_id = ${batchId} AND confirmed_by IS NULL`
    );
  }

  async findVerified(churchId: number, verified: number): Promise<TransactionRow[]> {
    return this.db
      .select()
      .from(transactions)
      .where(and(eq(transactions.churchId, churchId), eq(transactions.verified, verified)))
      .orderBy(desc(transactions.createdAt))
      .all();
  }

  async verifyOne(declarationId: number, verifierId: number): Promise<void> {
    await this.db.run(
      sql`UPDATE transactions SET
        verified = 1,
        verified_by = ${verifierId},
        verified_at = datetime('now')
        WHERE id = ${declarationId}`
    );
  }

  async deleteOne(transactionId: number): Promise<void> {
    await this.db.delete(transactions).where(eq(transactions.id, transactionId)).run();
  }

  async findDeclarationById(id: number): Promise<TransactionRow | undefined> {
    return this.db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.type, "income")))
      .get();
  }
}

export class BudgetRepo {
  constructor(private db: Db) {}

  async create(data: {
    churchId: number;
    fundId: number;
    categoryId: number;
    plannedAmount: number;
    fiscalYear: number;
  }): Promise<BudgetRow> {
    return this.db
      .insert(budgets)
      .values({
        churchId: data.churchId,
        fundId: data.fundId,
        categoryId: data.categoryId,
        plannedAmount: data.plannedAmount,
        fiscalYear: data.fiscalYear,
      })
      .returning()
      .get();
  }

  async findAll(churchId?: number, fiscalYear?: number): Promise<BudgetRow[]> {
    const conditions = [];
    if (churchId !== undefined) {
      conditions.push(eq(budgets.churchId, churchId));
    }
    if (fiscalYear !== undefined) {
      conditions.push(eq(budgets.fiscalYear, fiscalYear));
    }

    const query = this.db.select().from(budgets);
    if (conditions.length > 0) {
      return query
        .where(and(...conditions))
        .orderBy(desc(budgets.fiscalYear))
        .all();
    }
    return query.orderBy(desc(budgets.fiscalYear)).all();
  }

  async findById(id: number): Promise<BudgetRow | undefined> {
    return this.db.select().from(budgets).where(eq(budgets.id, id)).get();
  }

  async approve(id: number, approvedBy: number): Promise<void> {
    await this.db.run(
      sql`UPDATE budgets SET
        approved = 1,
        approved_by = ${approvedBy},
        approved_at = datetime('now')
        WHERE id = ${id}`
    );
  }
}

export class BudgetTemplateRepo {
  constructor(private db: Db) {}

  async create(data: {
    conferenceId: number;
    categoryId: number;
    fundId: number;
    plannedAmount: number;
    fiscalYear: number;
  }): Promise<BudgetTemplateRow> {
    return this.db
      .insert(budgetTemplates)
      .values({
        conferenceId: data.conferenceId,
        categoryId: data.categoryId,
        fundId: data.fundId,
        plannedAmount: data.plannedAmount,
        fiscalYear: data.fiscalYear,
      })
      .returning()
      .get();
  }

  async findAll(conferenceId: number): Promise<BudgetTemplateRow[]> {
    return this.db
      .select()
      .from(budgetTemplates)
      .where(eq(budgetTemplates.conferenceId, conferenceId))
      .orderBy(desc(budgetTemplates.fiscalYear))
      .all();
  }
}
