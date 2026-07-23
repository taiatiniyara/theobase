-- Migration 0005: Attendance tracking
-- Records weekly attendance counts by category per church

CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    church_id INTEGER NOT NULL REFERENCES churches(id),
    date TEXT NOT NULL,
    count INTEGER NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('sabbath-school', 'church-service', 'youth')),
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(church_id, date, category)
);

CREATE INDEX IF NOT EXISTS idx_attendance_church_date ON attendance(church_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_category ON attendance(category);

CREATE TABLE IF NOT EXISTS member_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attendance_id INTEGER NOT NULL REFERENCES attendance(id),
    member_id INTEGER NOT NULL REFERENCES members(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(attendance_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_member_attendance_time ON member_attendance(attendance_id);
