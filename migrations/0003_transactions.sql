CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  orgId TEXT NOT NULL REFERENCES orgs(id),
  fund TEXT NOT NULL CHECK(fund IN ('tithe','local-church-budget','conference-advance',
    'world-budget','special-projects','building-fund','ingathering',
    'investment-income','rental-income')),
  amount REAL NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('receipt','disbursement')),
  description TEXT,
  donorId TEXT REFERENCES members(id),
  verified INTEGER NOT NULL DEFAULT 0,
  verifiedBy TEXT REFERENCES users(id),
  createdBy TEXT NOT NULL REFERENCES users(id),
  proxyFor TEXT REFERENCES members(id),
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transactions_orgId ON transactions(orgId);
CREATE INDEX IF NOT EXISTS idx_transactions_fund ON transactions(fund);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_donorId ON transactions(donorId);
