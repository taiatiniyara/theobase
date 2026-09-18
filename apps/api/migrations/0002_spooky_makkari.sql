PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`display_name` text NOT NULL,
	`account_type` text NOT NULL,
	`role` text NOT NULL,
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
        ("__new_accounts"."account_type" = 'local'
          AND "__new_accounts"."phone" IS NOT NULL AND "__new_accounts"."pin_hash" IS NOT NULL
          AND "__new_accounts"."email" IS NULL AND "__new_accounts"."password_hash" IS NULL)
        OR
        ("__new_accounts"."account_type" = 'institutional'
          AND "__new_accounts"."email" IS NOT NULL AND "__new_accounts"."password_hash" IS NOT NULL
          AND "__new_accounts"."phone" IS NULL AND "__new_accounts"."pin_hash" IS NULL)
      ),
	CONSTRAINT "accounts_role_matches_account_type" CHECK(
        ("__new_accounts"."role" IN ('treasurer', 'clerk', 'pastor') AND "__new_accounts"."account_type" = 'local')
        OR
        ("__new_accounts"."role" IN ('mission_admin', 'mission_staff', 'platform_operator')
          AND "__new_accounts"."account_type" = 'institutional')
      ),
	CONSTRAINT "accounts_scope_matches_role" CHECK(
        ("__new_accounts"."role" IN ('treasurer', 'clerk')
          AND "__new_accounts"."church_id" IS NOT NULL AND "__new_accounts"."district_id" IS NULL AND "__new_accounts"."mission_id" IS NULL)
        OR
        ("__new_accounts"."role" = 'pastor'
          AND "__new_accounts"."district_id" IS NOT NULL AND "__new_accounts"."church_id" IS NULL AND "__new_accounts"."mission_id" IS NULL)
        OR
        ("__new_accounts"."role" IN ('mission_admin', 'mission_staff')
          AND "__new_accounts"."mission_id" IS NOT NULL AND "__new_accounts"."church_id" IS NULL AND "__new_accounts"."district_id" IS NULL)
        OR
        ("__new_accounts"."role" = 'platform_operator'
          AND "__new_accounts"."church_id" IS NULL AND "__new_accounts"."district_id" IS NULL AND "__new_accounts"."mission_id" IS NULL)
      )
);
--> statement-breakpoint
-- No INSERT...SELECT copy here (unlike the audit_log rebuild in
-- migration 0001): drizzle-kit generated one, but the old `accounts`
-- table (from 0001) has no `role` column, so selecting it would fail
-- even against an empty DB. role is NOT NULL with no default and no
-- sensible one to backfill, so this is a genuine breaking change —
-- acceptable pre-production (no real accounts exist yet to preserve).
DROP TABLE `accounts`;--> statement-breakpoint
ALTER TABLE `__new_accounts` RENAME TO `accounts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_phone_unique` ON `accounts` (`phone`);--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_email_unique` ON `accounts` (`email`);