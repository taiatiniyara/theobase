import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

const FULL_SCHEMA =
  `CREATE TABLE IF NOT EXISTS conferences (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, parent_union_id INTEGER, address TEXT, bank_details TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS districts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, conference_id INTEGER NOT NULL REFERENCES conferences(id), pastor_user_id INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS churches (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('organized', 'company', 'branch')), parent_id INTEGER NOT NULL, parent_type TEXT NOT NULL CHECK (parent_type IN ('conference', 'church')), district_id INTEGER REFERENCES districts(id), address TEXT, bank_details TEXT, charter_status TEXT, founded_date TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), household_id INTEGER, full_name TEXT NOT NULL, preferred_name TEXT, dob TEXT, gender TEXT, baptism_date TEXT, baptism_type TEXT, join_date TEXT, prev_church_id INTEGER REFERENCES churches(id), phone TEXT, email TEXT, address TEXT, marital_status TEXT, status TEXT NOT NULL DEFAULT 'active', status_date TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), version INTEGER NOT NULL DEFAULT 1);` +
  `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, member_id INTEGER REFERENCES members(id), conference_id INTEGER REFERENCES conferences(id), role TEXT NOT NULL CHECK (role IN ('president', 'secretary', 'treasurer', 'auditor', 'sysadmin', 'pastor', 'member')), email_verified INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS funds (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('tithe', 'local_budget', 'sabbath_school')), forwarding_rule TEXT NOT NULL, conference_id INTEGER NOT NULL REFERENCES conferences(id), created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS expense_categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, conference_id INTEGER NOT NULL REFERENCES conferences(id), active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS offering_batches (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), sabbath_date TEXT NOT NULL, confirmed_by_1 INTEGER REFERENCES users(id), confirmed_at_1 TEXT, confirmed_by_2 INTEGER REFERENCES users(id), confirmed_at_2 TEXT, submitted_by INTEGER REFERENCES users(id), submitted_at TEXT, status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'synced')), created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), fund_id INTEGER NOT NULL REFERENCES funds(id), type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'forward')), amount REAL NOT NULL, description TEXT, category_id INTEGER REFERENCES expense_categories(id), budget_ref INTEGER, batch_id INTEGER REFERENCES offering_batches(id), envelope_number INTEGER, member_id INTEGER REFERENCES members(id), created_by INTEGER NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (datetime('now')), confirmed_by INTEGER REFERENCES users(id), confirmed_at TEXT, uuid TEXT NOT NULL UNIQUE);` +
  `CREATE TABLE IF NOT EXISTS budgets (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), fund_id INTEGER NOT NULL REFERENCES funds(id), category_id INTEGER NOT NULL REFERENCES expense_categories(id), planned_amount REAL NOT NULL, fiscal_year INTEGER NOT NULL, approved INTEGER NOT NULL DEFAULT 0, approved_by INTEGER REFERENCES users(id), approved_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS budget_templates (id INTEGER PRIMARY KEY AUTOINCREMENT, conference_id INTEGER NOT NULL REFERENCES conferences(id), category_id INTEGER NOT NULL REFERENCES expense_categories(id), fund_id INTEGER NOT NULL REFERENCES funds(id), planned_amount REAL NOT NULL, fiscal_year INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(conference_id, category_id, fund_id, fiscal_year));`;

describe("finance API", () => {
  let accessToken: string;
  let conferenceId: number;
  let churchId: number;
  let titheFundId: number;
  let budgetFundId: number;
  let catId: number;

  beforeAll(async () => {
    await env.DB.exec(FULL_SCHEMA);
    await env.DB.exec("ALTER TABLE users ADD COLUMN reset_token TEXT;");
    await env.DB.exec("ALTER TABLE users ADD COLUMN reset_token_expires TEXT;");
    await env.DB.exec("ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1;");
    await env.DB.exec("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active';");
    await env.DB.exec("ALTER TABLE churches ADD COLUMN status TEXT NOT NULL DEFAULT 'active';");
    await env.DB.exec(
      "ALTER TABLE transactions ADD COLUMN corrects_transaction_id INTEGER REFERENCES transactions(id)"
    );
    await env.DB.exec(
      "ALTER TABLE transactions ADD COLUMN proxy_for_member_id INTEGER REFERENCES members(id)"
    );
    await env.DB.exec("ALTER TABLE transactions ADD COLUMN verified INTEGER NOT NULL DEFAULT 0");
    await env.DB.exec(
      "ALTER TABLE transactions ADD COLUMN verified_by INTEGER REFERENCES users(id)"
    );
    await env.DB.exec("ALTER TABLE transactions ADD COLUMN verified_at TEXT");

    const sr = await SELF.fetch("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "fa@t.com",
        password: "password123",
        fullName: "FA",
        conferenceName: "Central",
      }),
    });
    expect(sr.status).toBe(200);
    await env.DB.prepare("UPDATE users SET email_verified = 1 WHERE email = ?")
      .bind("fa@t.com")
      .run();
    const loginSr = await SELF.fetch("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "fa@t.com", password: "password123" }),
    });
    const sb = (await loginSr.json()) as { accessToken: string };
    accessToken = sb.accessToken;

    const mr = await SELF.fetch("http://localhost/api/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const mb = (await mr.json()) as { conference: { id: number } };
    conferenceId = mb.conference.id;

    const cr = await SELF.fetch("http://localhost/api/churches", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        name: "Central Church",
        type: "organized",
        parentId: conferenceId,
        parentType: "conference",
      }),
    });
    churchId = ((await cr.json()) as { id: number }).id;

    // Create funds
    const f1 = await SELF.fetch("http://localhost/api/funds", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        name: "Tithe",
        type: "tithe",
        forwardingRule: "conference",
        conferenceId,
      }),
    });
    titheFundId = ((await f1.json()) as { id: number }).id;

    const f2 = await SELF.fetch("http://localhost/api/funds", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        name: "Local Budget",
        type: "local_budget",
        forwardingRule: "local",
        conferenceId,
      }),
    });
    budgetFundId = ((await f2.json()) as { id: number }).id;

    // Create expense category
    const c = await SELF.fetch("http://localhost/api/expense-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ name: "Utilities", conferenceId }),
    });
    catId = ((await c.json()) as { id: number }).id;
  });

  function h() {
    return { Authorization: `Bearer ${accessToken}` };
  }
  function jh() {
    return { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` };
  }

  it("funds list works", async () => {
    const r = await SELF.fetch(`http://localhost/api/funds?conference_id=${conferenceId}`, {
      headers: h(),
    });
    expect(r.status).toBe(200);
    const b = (await r.json()) as { funds: unknown[] };
    expect(b.funds.length).toBe(2);
  });

  it("expense categories list works", async () => {
    const r = await SELF.fetch(
      `http://localhost/api/expense-categories?conference_id=${conferenceId}`,
      { headers: h() }
    );
    expect(r.status).toBe(200);
    const b = (await r.json()) as { expenseCategories: unknown[] };
    expect(b.expenseCategories.length).toBe(1);
  });

  it("offering batch dual-custody workflow", async () => {
    const r = await SELF.fetch("http://localhost/api/finance/batches", {
      method: "POST",
      headers: jh(),
      body: JSON.stringify({ churchId, sabbathDate: "2026-07-18" }),
    });
    expect(r.status).toBe(201);
    const batchId = ((await r.json()) as { id: number }).id;

    const t1 = await SELF.fetch("http://localhost/api/finance/transactions", {
      method: "POST",
      headers: jh(),
      body: JSON.stringify({
        churchId,
        fundId: titheFundId,
        amount: 500,
        description: "E1",
        batchId,
      }),
    });
    expect(t1.status).toBe(201);

    const t2 = await SELF.fetch("http://localhost/api/finance/transactions", {
      method: "POST",
      headers: jh(),
      body: JSON.stringify({
        churchId,
        fundId: budgetFundId,
        amount: 250,
        description: "E2",
        batchId,
      }),
    });
    expect(t2.status).toBe(201);

    const detail = await SELF.fetch(`http://localhost/api/finance/batches/${batchId}`, {
      headers: h(),
    });
    expect(detail.status).toBe(200);

    const c1 = await SELF.fetch(`http://localhost/api/finance/batches/${batchId}/confirm`, {
      method: "POST",
      headers: h(),
    });
    expect(c1.status).toBe(200);

    const dup = await SELF.fetch(`http://localhost/api/finance/batches/${batchId}/confirm`, {
      method: "POST",
      headers: h(),
    });
    expect(dup.status).toBe(400);
  });

  it("expense creation", async () => {
    const r = await SELF.fetch("http://localhost/api/finance/expenses", {
      method: "POST",
      headers: jh(),
      body: JSON.stringify({
        churchId,
        fundId: budgetFundId,
        amount: 100,
        description: "Electricity",
        categoryId: catId,
      }),
    });
    expect(r.status).toBe(201);
  });

  it("budgets CRUD", async () => {
    const r = await SELF.fetch("http://localhost/api/finance/budgets", {
      method: "POST",
      headers: jh(),
      body: JSON.stringify({
        churchId,
        fundId: budgetFundId,
        categoryId: catId,
        plannedAmount: 5000,
        fiscalYear: 2026,
      }),
    });
    expect(r.status).toBe(201);

    const list = await SELF.fetch(
      `http://localhost/api/finance/budgets?church_id=${churchId}&fiscal_year=2026`,
      { headers: h() }
    );
    expect(list.status).toBe(200);
    const lb = (await list.json()) as { budgets: { planned_amount: number; id: number }[] };
    expect(lb.budgets.length).toBe(1);
    expect(lb.budgets[0]!.planned_amount).toBe(5000);

    // Approve budget
    const approveRes = await SELF.fetch(
      `http://localhost/api/finance/budgets/${lb.budgets[0]!.id}/approve`,
      { method: "POST", headers: h() }
    );
    expect(approveRes.status).toBe(200);
  });

  it("budget templates", async () => {
    const r = await SELF.fetch("http://localhost/api/finance/budget-templates", {
      method: "POST",
      headers: jh(),
      body: JSON.stringify({
        conferenceId,
        categoryId: catId,
        fundId: budgetFundId,
        plannedAmount: 3000,
        fiscalYear: 2026,
      }),
    });
    expect(r.status).toBe(201);

    const list = await SELF.fetch(
      `http://localhost/api/finance/budget-templates?conference_id=${conferenceId}&fiscal_year=2026`,
      { headers: h() }
    );
    expect(list.status).toBe(200);
  });

  it("envelope number uniqueness in batch", async () => {
    const r = await SELF.fetch("http://localhost/api/finance/batches", {
      method: "POST",
      headers: jh(),
      body: JSON.stringify({ churchId, sabbathDate: "2026-07-25" }),
    });
    expect(r.status).toBe(201);
    const batchId = ((await r.json()) as { id: number }).id;

    const t1 = await SELF.fetch("http://localhost/api/finance/transactions", {
      method: "POST",
      headers: jh(),
      body: JSON.stringify({
        churchId,
        fundId: titheFundId,
        amount: 100,
        batchId,
        envelopeNumber: 1,
      }),
    });
    expect(t1.status).toBe(201);

    const t2 = await SELF.fetch("http://localhost/api/finance/transactions", {
      method: "POST",
      headers: jh(),
      body: JSON.stringify({
        churchId,
        fundId: budgetFundId,
        amount: 50,
        batchId,
        envelopeNumber: 1,
      }),
    });
    expect(t2.status).toBe(409);
  });

  it("monthly treasurer report", async () => {
    const r = await SELF.fetch(
      `http://localhost/api/finance/report/monthly?church_id=${churchId}&year=2026&month=7`,
      { headers: h() }
    );
    expect(r.status).toBe(200);
  });

  it("branch treasury routes to parent organized church", async () => {
    const parentRes = await SELF.fetch("http://localhost/api/churches", {
      method: "POST",
      headers: jh(),
      body: JSON.stringify({
        name: "Parent Org",
        type: "organized",
        parentId: conferenceId,
        parentType: "conference",
      }),
    });
    expect(parentRes.status).toBe(201);
    const parentBody = (await parentRes.json()) as { id: number };
    const parentId = parentBody.id;

    const branchRes = await SELF.fetch("http://localhost/api/churches", {
      method: "POST",
      headers: jh(),
      body: JSON.stringify({
        name: "Branch Church",
        type: "branch",
        parentId,
        parentType: "church",
      }),
    });
    expect(branchRes.status).toBe(201);
    const branchBody = (await branchRes.json()) as { id: number };
    const branchId = branchBody.id;

    const batchRes = await SELF.fetch("http://localhost/api/finance/batches", {
      method: "POST",
      headers: jh(),
      body: JSON.stringify({
        churchId: branchId,
        sabbathDate: "2026-07-04",
      }),
    });
    expect(batchRes.status).toBe(201);
    const batch = (await batchRes.json()) as { id: number };
    expect(batch.id).toBeTypeOf("number");
  });

  it("rejects unauthenticated access", async () => {
    for (const ep of [
      "/api/funds",
      "/api/finance/batches",
      "/api/finance/transactions",
      "/api/finance/budgets",
    ]) {
      expect((await SELF.fetch(`http://localhost${ep}`)).status).toBe(401);
    }
  });

  it("validation: rejects invalid data", async () => {
    const r1 = await SELF.fetch("http://localhost/api/finance/batches", {
      method: "POST",
      headers: jh(),
      body: JSON.stringify({}),
    });
    expect(r1.status).toBe(400);

    const r2 = await SELF.fetch("http://localhost/api/finance/batches/99999", { headers: h() });
    expect(r2.status).toBe(404);
  });

  it("void unconfirmed transaction", async () => {
    const bh = jh();
    const bRes = await SELF.fetch("http://localhost/api/finance/batches", {
      method: "POST",
      headers: bh,
      body: JSON.stringify({ churchId, sabbathDate: "2025-01-04" }),
    });
    const batch = (await bRes.json()) as { id: number };

    const tRes = await SELF.fetch("http://localhost/api/finance/transactions", {
      method: "POST",
      headers: bh,
      body: JSON.stringify({ churchId, fundId: titheFundId, amount: 50, batchId: batch.id }),
    });
    const txn = (await tRes.json()) as { id: number };

    const voidRes = await SELF.fetch(`http://localhost/api/finance/transactions/${txn.id}/void`, {
      method: "POST",
      headers: bh,
    });
    expect(voidRes.status).toBe(200);
    const voidBody = (await voidRes.json()) as { voided: boolean };
    expect(voidBody.voided).toBe(true);

    const voidAgain = await SELF.fetch(`http://localhost/api/finance/transactions/${txn.id}/void`, {
      method: "POST",
      headers: bh,
    });
    expect(voidAgain.status).toBe(400);
  });

  it("reverse confirmed transaction", async () => {
    const bh = jh();
    const bRes = await SELF.fetch("http://localhost/api/finance/batches", {
      method: "POST",
      headers: bh,
      body: JSON.stringify({ churchId, sabbathDate: "2025-01-11" }),
    });
    const batch = (await bRes.json()) as { id: number };

    const tRes = await SELF.fetch("http://localhost/api/finance/transactions", {
      method: "POST",
      headers: bh,
      body: JSON.stringify({ churchId, fundId: titheFundId, amount: 100, batchId: batch.id }),
    });
    const txn = (await tRes.json()) as { id: number };

    const reverseRes = await SELF.fetch(
      `http://localhost/api/finance/transactions/${txn.id}/reverse`,
      { method: "POST", headers: bh }
    );
    expect(reverseRes.status).toBe(400);

    // Confirm batch, then confirm transaction
    await SELF.fetch(`http://localhost/api/finance/batches/${batch.id}/confirm`, {
      method: "POST",
      headers: bh,
    });
    await env.DB.prepare(
      "UPDATE transactions SET confirmed_by = 1, confirmed_at = datetime('now') WHERE id = ?"
    )
      .bind(txn.id)
      .run();

    const reverseRes2 = await SELF.fetch(
      `http://localhost/api/finance/transactions/${txn.id}/reverse`,
      { method: "POST", headers: bh, body: JSON.stringify({ description: "Test reversal" }) }
    );
    expect(reverseRes2.status).toBe(201);
    const reversal = (await reverseRes2.json()) as {
      reversed: boolean;
      amount: number;
      originalId: number;
    };
    expect(reversal.reversed).toBe(true);
    expect(reversal.amount).toBe(-100);
    expect(reversal.originalId).toBe(txn.id);
  });
});
