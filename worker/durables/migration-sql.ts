export const MIGRATION_SQL = `-- Theobase initial schema
-- 17 tables: org, people, finance, membership workflows, cross-cutting, and module registry

-- Organization
CREATE TABLE conferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    parent_union_id INTEGER,
    address TEXT,
    bank_details TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE districts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    conference_id INTEGER NOT NULL REFERENCES conferences(id),
    pastor_user_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE churches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('organized', 'company', 'branch')),
    parent_id INTEGER NOT NULL,
    parent_type TEXT NOT NULL CHECK (parent_type IN ('conference', 'church')),
    district_id INTEGER REFERENCES districts(id),
    address TEXT,
    bank_details TEXT,
    charter_status TEXT,
    founded_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- People
CREATE TABLE households (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    church_id INTEGER NOT NULL REFERENCES churches(id),
    head_member_id INTEGER,
    name TEXT NOT NULL,
    address TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    church_id INTEGER NOT NULL REFERENCES churches(id),
    household_id INTEGER REFERENCES households(id),
    full_name TEXT NOT NULL,
    preferred_name TEXT,
    dob TEXT,
    gender TEXT,
    baptism_date TEXT,
    baptism_type TEXT CHECK (baptism_type IN ('immersion', 'profession_of_faith')),
    join_date TEXT,
    prev_church_id INTEGER REFERENCES churches(id),
    phone TEXT,
    email TEXT,
    address TEXT,
    marital_status TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'deceased', 'removed')),
    status_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    module TEXT NOT NULL DEFAULT 'core'
);

CREATE TABLE member_positions (
    member_id INTEGER NOT NULL REFERENCES members(id),
    position_id INTEGER NOT NULL REFERENCES positions(id),
    start_date TEXT NOT NULL DEFAULT (datetime('now')),
    end_date TEXT,
    PRIMARY KEY (member_id, position_id)
);

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    member_id INTEGER REFERENCES members(id),
    conference_id INTEGER REFERENCES conferences(id),
    role TEXT NOT NULL CHECK (role IN ('president', 'secretary', 'treasurer', 'auditor', 'sysadmin', 'pastor', 'member')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Finance
CREATE TABLE funds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('tithe', 'local_budget', 'sabbath_school')),
    forwarding_rule TEXT NOT NULL,
    conference_id INTEGER NOT NULL REFERENCES conferences(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE expense_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    conference_id INTEGER NOT NULL REFERENCES conferences(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE offering_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    church_id INTEGER NOT NULL REFERENCES churches(id),
    sabbath_date TEXT NOT NULL,
    confirmed_by_1 INTEGER REFERENCES users(id),
    confirmed_at_1 TEXT,
    confirmed_by_2 INTEGER REFERENCES users(id),
    confirmed_at_2 TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'synced')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    church_id INTEGER NOT NULL REFERENCES churches(id),
    fund_id INTEGER NOT NULL REFERENCES funds(id),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'forward')),
    amount REAL NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES expense_categories(id),
    budget_ref INTEGER,
    batch_id INTEGER REFERENCES offering_batches(id),
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    confirmed_by INTEGER REFERENCES users(id),
    confirmed_at TEXT,
    uuid TEXT NOT NULL UNIQUE
);

CREATE TABLE budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    church_id INTEGER NOT NULL REFERENCES churches(id),
    fund_id INTEGER NOT NULL REFERENCES funds(id),
    category_id INTEGER NOT NULL REFERENCES expense_categories(id),
    planned_amount REAL NOT NULL,
    fiscal_year INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Membership workflows
CREATE TABLE transfer_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL REFERENCES members(id),
    from_church_id INTEGER NOT NULL REFERENCES churches(id),
    to_church_id INTEGER NOT NULL REFERENCES churches(id),
    initiated_by INTEGER NOT NULL REFERENCES users(id),
    initiated_at TEXT NOT NULL DEFAULT (datetime('now')),
    conference_approved_by INTEGER REFERENCES users(id),
    conference_approved_at TEXT,
    accepted_by INTEGER REFERENCES users(id),
    accepted_at TEXT,
    status TEXT NOT NULL DEFAULT 'pending_conference' CHECK (status IN ('pending_conference', 'pending_destination', 'completed', 'rejected'))
);

-- Cross-cutting
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    actor_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    prev_state TEXT,
    new_state TEXT,
    module TEXT NOT NULL DEFAULT 'core',
    device_info TEXT
);

CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_user_id INTEGER NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Module registry (platform core)
CREATE TABLE modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    version TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX idx_churches_parent ON churches(parent_id, parent_type);
CREATE INDEX idx_churches_district ON churches(district_id);
CREATE INDEX idx_members_church ON members(church_id);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_conference ON users(conference_id);
CREATE INDEX idx_transactions_church ON transactions(church_id);
CREATE INDEX idx_transactions_batch ON transactions(batch_id);
CREATE INDEX idx_transactions_uuid ON transactions(uuid);
CREATE INDEX idx_offering_batches_church ON offering_batches(church_id);
CREATE INDEX idx_offering_batches_status ON offering_batches(status);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_user_id, read);
-- Add password reset columns to users table
ALTER TABLE users ADD COLUMN reset_token TEXT;
ALTER TABLE users ADD COLUMN reset_token_expires TEXT;
-- Reconciliation: church-month records for tithe forwarding and bank balance matching
CREATE TABLE IF NOT EXISTS reconciliations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    church_id INTEGER NOT NULL REFERENCES churches(id),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    forwarded_tithe REAL NOT NULL DEFAULT 0,
    received_tithe REAL,
    tithe_discrepancy REAL,
    tithe_status TEXT NOT NULL DEFAULT 'pending' CHECK (tithe_status IN ('pending', 'received', 'discrepancy')),
    tithe_note TEXT,
    bank_balance REAL,
    system_balance REAL,
    bank_discrepancy REAL,
    bank_note TEXT,
    reconciled_by INTEGER REFERENCES users(id),
    reconciled_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(church_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_reconciliations_church ON reconciliations(church_id);
CREATE INDEX IF NOT EXISTS idx_reconciliations_year_month ON reconciliations(year, month);
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
-- Migration 0005: Attendance tracking
-- Records weekly attendance counts by category per church

CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    church_id INTEGER NOT NULL REFERENCES churches(id),
    date TEXT NOT NULL,
    count INTEGER NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('sabbath-school', 'church-service', 'youth')),
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(church_id, date, category)
);

CREATE INDEX IF NOT EXISTS idx_attendance_church_date ON attendance(church_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_category ON attendance(category);

CREATE TABLE IF NOT EXISTS member_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attendance_id INTEGER NOT NULL REFERENCES attendance(id),
    member_id INTEGER NOT NULL REFERENCES members(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(attendance_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_member_attendance_time ON member_attendance(attendance_id);
-- Rate limiting support
CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT NOT NULL,
    window_start INTEGER NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (key, window_start)
);
-- User management enhancements
ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1;
-- Migration 0008: Member self-service — proxy entry, verified declarations, user->member link
ALTER TABLE transactions ADD COLUMN proxy_for_member_id INTEGER REFERENCES members(id);
ALTER TABLE transactions ADD COLUMN verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE transactions ADD COLUMN verified_by INTEGER REFERENCES users(id);
ALTER TABLE transactions ADD COLUMN verified_at TEXT;

CREATE INDEX idx_transactions_verified ON transactions(verified);
CREATE INDEX idx_transactions_member ON transactions(member_id, verified);
-- Migration 0009: Transfer lifecycle — expiry, conference override, timeline

ALTER TABLE transfer_requests ADD COLUMN expires_at TEXT;

ALTER TABLE transfer_requests ADD COLUMN override_by INTEGER REFERENCES users(id);
ALTER TABLE transfer_requests ADD COLUMN override_at TEXT;
ALTER TABLE transfer_requests ADD COLUMN override_action TEXT;
ALTER TABLE transfer_requests ADD COLUMN override_note TEXT;

CREATE TABLE transfer_requests_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL REFERENCES members(id),
    from_church_id INTEGER NOT NULL REFERENCES churches(id),
    to_church_id INTEGER NOT NULL REFERENCES churches(id),
    initiated_by INTEGER NOT NULL REFERENCES users(id),
    initiated_at TEXT NOT NULL DEFAULT (datetime('now')),
    conference_approved_by INTEGER REFERENCES users(id),
    conference_approved_at TEXT,
    accepted_by INTEGER REFERENCES users(id),
    accepted_at TEXT,
    status TEXT NOT NULL DEFAULT 'pending_conference' CHECK (status IN ('pending_conference', 'pending_destination', 'completed', 'rejected', 'expired')),
    rejection_note TEXT,
    expires_at TEXT,
    override_by INTEGER REFERENCES users(id),
    override_at TEXT,
    override_action TEXT,
    override_note TEXT
);

INSERT INTO transfer_requests_new (id, member_id, from_church_id, to_church_id, initiated_by, initiated_at, conference_approved_by, conference_approved_at, accepted_by, accepted_at, status, rejection_note, expires_at, override_by, override_at, override_action, override_note)
SELECT id, member_id, from_church_id, to_church_id, initiated_by, initiated_at, conference_approved_by, conference_approved_at, accepted_by, accepted_at, status, rejection_note, NULL, NULL, NULL, NULL, NULL FROM transfer_requests;

DROP TABLE transfer_requests;
ALTER TABLE transfer_requests_new RENAME TO transfer_requests;
-- Add email_verified column, defaulting to 1 (existing users grandfathered)
ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 1;`;
