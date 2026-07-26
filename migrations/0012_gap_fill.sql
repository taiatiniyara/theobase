-- Gap fill: logout, transaction correction, settings, deactivation
-- Ticket #183 — schema foundation for MVP gap fill

-- Token blacklist for logout / token invalidation
CREATE TABLE IF NOT EXISTS token_blacklist (
    token_jti TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti ON token_blacklist(token_jti);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);

-- Transaction correction: links a reversal entry to the original
ALTER TABLE transactions ADD COLUMN corrects_transaction_id INTEGER REFERENCES transactions(id);

-- User deactivation: soft-deactivate while preserving audit trail
-- (users.active INTEGER from 0007 remains; this adds a richer state column)
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Church deactivation: soft-deactivate closed/merged churches
ALTER TABLE churches ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'merged'));

-- Settings tables per scope
CREATE TABLE IF NOT EXISTS church_settings (
    church_id INTEGER PRIMARY KEY REFERENCES churches(id),
    name TEXT,
    address TEXT,
    phone TEXT,
    fiscal_year_start INTEGER NOT NULL DEFAULT 1,
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    notification_prefs TEXT,
    language TEXT NOT NULL DEFAULT 'en',
    preferred_church_id INTEGER REFERENCES churches(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conference_settings (
    conference_id INTEGER PRIMARY KEY REFERENCES conferences(id),
    name TEXT,
    address TEXT,
    phone TEXT,
    bank_details TEXT,
    default_currency TEXT NOT NULL DEFAULT 'USD',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
