-- Add email_verified column, defaulting to 1 (existing users grandfathered)
ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 1;
