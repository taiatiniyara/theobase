-- Theobase initial schema
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
