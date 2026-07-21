CREATE TABLE IF NOT EXISTS orgs (
  id TEXT PRIMARY KEY,
  parentId TEXT REFERENCES orgs(id),
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK(level IN ('division','union','conference','church','company')),
  districtId TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  orgId TEXT NOT NULL REFERENCES orgs(id),
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('member','clerk','treasurer','pastor','elder',
    'conference-secretary','conference-treasurer','union-officer','division-officer','system-admin')),
  memberId TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tokenHash TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_orgId ON users(orgId);
CREATE INDEX IF NOT EXISTS idx_orgs_parentId ON orgs(parentId);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_userId ON refresh_tokens(userId);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expiresAt ON refresh_tokens(expiresAt);
