-- Migration 0004: Finance batch, transfer, and budget enhancements
-- Adds envelope tracking, transfer rejection notes, budget templates, and more

-- Envelope tracking per transaction
ALTER TABLE transactions ADD COLUMN envelope_number INTEGER;
ALTER TABLE transactions ADD COLUMN member_id INTEGER REFERENCES members(id);

-- Batch submitter (the person who counted/submitted)
ALTER TABLE offering_batches ADD COLUMN submitted_by INTEGER REFERENCES users(id);
ALTER TABLE offering_batches ADD COLUMN submitted_at TEXT;

-- Transfer rejection notes
ALTER TABLE transfer_requests ADD COLUMN rejection_note TEXT;

-- Expense category active flag for conference management
ALTER TABLE expense_categories ADD COLUMN active INTEGER NOT NULL DEFAULT 1;

-- Conference-level budget templates (inheritable by new churches)
CREATE TABLE IF NOT EXISTS budget_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conference_id INTEGER NOT NULL REFERENCES conferences(id),
    category_id INTEGER NOT NULL REFERENCES expense_categories(id),
    fund_id INTEGER NOT NULL REFERENCES funds(id),
    planned_amount REAL NOT NULL,
    fiscal_year INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(conference_id, category_id, fund_id, fiscal_year)
);

-- Budget approval status for board-vote locking
ALTER TABLE budgets ADD COLUMN approved INTEGER NOT NULL DEFAULT 0;
ALTER TABLE budgets ADD COLUMN approved_by INTEGER REFERENCES users(id);
ALTER TABLE budgets ADD COLUMN approved_at TEXT;

-- Offering batch draft state
CREATE TABLE IF NOT EXISTS batch_drafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    church_id INTEGER NOT NULL REFERENCES churches(id),
    sabbath_date TEXT NOT NULL,
    data TEXT NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
