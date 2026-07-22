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
