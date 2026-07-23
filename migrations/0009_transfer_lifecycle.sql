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
