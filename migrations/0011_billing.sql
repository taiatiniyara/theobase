-- Billing: subscriptions and invoices for per-Conference metered billing
CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conference_id INTEGER NOT NULL UNIQUE REFERENCES conferences(id),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    church_count INTEGER NOT NULL DEFAULT 0,
    trial_ends_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'read_only', 'canceled')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conference_id INTEGER NOT NULL REFERENCES conferences(id),
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    church_count INTEGER NOT NULL,
    amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    stripe_invoice_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
