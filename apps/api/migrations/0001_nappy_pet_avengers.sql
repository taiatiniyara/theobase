CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`display_name` text NOT NULL,
	`account_type` text NOT NULL,
	`phone` text,
	`pin_hash` text,
	`email` text,
	`password_hash` text,
	`church_id` integer,
	`district_id` integer,
	`mission_id` integer,
	`failed_login_attempts` integer DEFAULT 0 NOT NULL,
	`locked_until` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`church_id`) REFERENCES `churches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "accounts_credentials_match_type" CHECK(
        ("accounts"."account_type" = 'local'
          AND "accounts"."phone" IS NOT NULL AND "accounts"."pin_hash" IS NOT NULL
          AND "accounts"."email" IS NULL AND "accounts"."password_hash" IS NULL)
        OR
        ("accounts"."account_type" = 'institutional'
          AND "accounts"."email" IS NOT NULL AND "accounts"."password_hash" IS NOT NULL
          AND "accounts"."phone" IS NULL AND "accounts"."pin_hash" IS NULL)
      )
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_phone_unique` ON `accounts` (`phone`);--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_email_unique` ON `accounts` (`email`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` integer NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_id` integer NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer NOT NULL,
	`action` text NOT NULL,
	`reason` text,
	`metadata` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_audit_log`("id", "actor_id", "entity_type", "entity_id", "action", "reason", "metadata", "created_at") SELECT "id", "actor_id", "entity_type", "entity_id", "action", "reason", "metadata", "created_at" FROM `audit_log`;--> statement-breakpoint
DROP TABLE `audit_log`;--> statement-breakpoint
ALTER TABLE `__new_audit_log` RENAME TO `audit_log`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
--> statement-breakpoint
-- Recreating audit_log above (to add the actor_id FK) drops the
-- append-only triggers from migration 0000 along with the old table
-- (SQLite drops a table's triggers when the table is dropped) — recreate
-- them here so the guarantee still holds.
CREATE TRIGGER `audit_log_no_update`
BEFORE UPDATE ON `audit_log`
BEGIN
	SELECT RAISE(ABORT, 'audit_log is append-only: updates are not allowed');
END;
--> statement-breakpoint
CREATE TRIGGER `audit_log_no_delete`
BEFORE DELETE ON `audit_log`
BEGIN
	SELECT RAISE(ABORT, 'audit_log is append-only: deletes are not allowed');
END;
