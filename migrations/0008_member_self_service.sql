-- Migration 0008: Member self-service — proxy entry, verified declarations, user->member link
ALTER TABLE transactions ADD COLUMN proxy_for_member_id INTEGER REFERENCES members(id);
ALTER TABLE transactions ADD COLUMN verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE transactions ADD COLUMN verified_by INTEGER REFERENCES users(id);
ALTER TABLE transactions ADD COLUMN verified_at TEXT;

CREATE INDEX idx_transactions_verified ON transactions(verified);
CREATE INDEX idx_transactions_member ON transactions(member_id, verified);
