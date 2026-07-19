-- Create offering plans table (configurable per tenant)
CREATE TABLE IF NOT EXISTS offering_plans (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  local_percent INTEGER NOT NULL CHECK(local_percent >= 0 AND local_percent <= 100),
  conference_percent INTEGER NOT NULL CHECK(conference_percent >= 0 AND conference_percent <= 100),
  union_percent INTEGER NOT NULL CHECK(union_percent >= 0 AND union_percent <= 100),
  gc_percent INTEGER NOT NULL CHECK(gc_percent >= 0 AND gc_percent <= 100),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Create fund allocations table (audit trail for automatic allocation)
CREATE TABLE IF NOT EXISTS fund_allocations (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  fund_type TEXT NOT NULL CHECK(fund_type IN ('tithe', 'offering')),
  amount INTEGER NOT NULL CHECK(amount > 0),
  destination_org_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  FOREIGN KEY (destination_org_id) REFERENCES organizations(id)
);

-- Create remittances table (audit trail for transfers)
CREATE TABLE IF NOT EXISTS remittances (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  source_org_id TEXT NOT NULL,
  destination_org_id TEXT NOT NULL,
  fund_type TEXT NOT NULL CHECK(fund_type IN ('tithe', 'offering')),
  amount INTEGER NOT NULL CHECK(amount > 0),
  user_id TEXT NOT NULL,
  remittance_date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (source_org_id) REFERENCES organizations(id),
  FOREIGN KEY (destination_org_id) REFERENCES organizations(id),
  FOREIGN KEY (user_id) REFERENCES members(id)
);

-- Create balances table (current balance per org/fund)
CREATE TABLE IF NOT EXISTS balances (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  fund_type TEXT NOT NULL CHECK(fund_type IN ('tithe', 'offering')),
  amount INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  UNIQUE(tenant_id, organization_id, fund_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_offering_plans_tenant ON offering_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fund_allocations_transaction ON fund_allocations(transaction_id);
CREATE INDEX IF NOT EXISTS idx_fund_allocations_destination ON fund_allocations(destination_org_id);
CREATE INDEX IF NOT EXISTS idx_remittances_tenant ON remittances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_remittances_source ON remittances(source_org_id);
CREATE INDEX IF NOT EXISTS idx_remittances_destination ON remittances(destination_org_id);
CREATE INDEX IF NOT EXISTS idx_balances_tenant ON balances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_balances_organization ON balances(organization_id);
