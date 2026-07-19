-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  member_id TEXT,
  fund_type TEXT NOT NULL CHECK(fund_type IN ('tithe', 'offering')),
  amount INTEGER NOT NULL CHECK(amount > 0),
  transaction_date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (member_id) REFERENCES members(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_organization ON transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_transactions_member ON transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_fund_type ON transactions(fund_type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
