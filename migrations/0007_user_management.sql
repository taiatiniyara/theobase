-- User management enhancements
ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1;
