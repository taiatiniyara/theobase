CREATE TABLE `account_removal_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`target_account_id` integer NOT NULL,
	`requested_by_account_id` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by_account_id` integer,
	`reviewed_at` text,
	`rejection_reason` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`target_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "account_removal_requests_review_progression" CHECK(
        ("account_removal_requests"."status" = 'pending'
          AND "account_removal_requests"."reviewed_by_account_id" IS NULL AND "account_removal_requests"."reviewed_at" IS NULL
          AND "account_removal_requests"."rejection_reason" IS NULL)
        OR
        ("account_removal_requests"."status" = 'approved'
          AND "account_removal_requests"."reviewed_by_account_id" IS NOT NULL AND "account_removal_requests"."reviewed_at" IS NOT NULL
          AND "account_removal_requests"."rejection_reason" IS NULL)
        OR
        ("account_removal_requests"."status" = 'rejected'
          AND "account_removal_requests"."reviewed_by_account_id" IS NOT NULL AND "account_removal_requests"."reviewed_at" IS NOT NULL
          AND "account_removal_requests"."rejection_reason" IS NOT NULL)
      )
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_removal_requests_one_pending_per_target` ON `account_removal_requests` (`target_account_id`) WHERE "account_removal_requests"."status" = 'pending';--> statement-breakpoint
ALTER TABLE `accounts` ADD `active` integer DEFAULT true NOT NULL;