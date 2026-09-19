CREATE TABLE `reconciliation_lines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reconciliation_id` integer NOT NULL,
	`fund_category_id` integer NOT NULL,
	`received_amount_cents` integer NOT NULL,
	FOREIGN KEY (`reconciliation_id`) REFERENCES `reconciliations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fund_category_id`) REFERENCES `fund_categories`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "reconciliation_lines_amount_non_negative" CHECK("reconciliation_lines"."received_amount_cents" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reconciliation_lines_reconciliation_category_unique` ON `reconciliation_lines` (`reconciliation_id`,`fund_category_id`);--> statement-breakpoint
CREATE TABLE `reconciliations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`count_id` integer NOT NULL,
	`status` text DEFAULT 'submitted' NOT NULL,
	`courier_name` text,
	`sent_at` text,
	`sent_by_account_id` integer,
	`received_at` text,
	`received_by_account_id` integer,
	`has_discrepancy` integer DEFAULT false NOT NULL,
	`discrepancy_proposed_by_account_id` integer,
	`discrepancy_proposed_reason` text,
	`discrepancy_proposed_at` text,
	`discrepancy_confirmed_by_account_id` integer,
	`discrepancy_resolved_at` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`count_id`) REFERENCES `counts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sent_by_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`received_by_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`discrepancy_proposed_by_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`discrepancy_confirmed_by_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "reconciliations_status_progression" CHECK(
        ("reconciliations"."status" = 'submitted'
          AND "reconciliations"."sent_at" IS NULL AND "reconciliations"."sent_by_account_id" IS NULL
          AND "reconciliations"."received_at" IS NULL AND "reconciliations"."received_by_account_id" IS NULL)
        OR
        ("reconciliations"."status" = 'in_transit'
          AND "reconciliations"."sent_at" IS NOT NULL AND "reconciliations"."sent_by_account_id" IS NOT NULL
          AND "reconciliations"."received_at" IS NULL AND "reconciliations"."received_by_account_id" IS NULL)
        OR
        ("reconciliations"."status" = 'received'
          AND "reconciliations"."sent_at" IS NOT NULL AND "reconciliations"."sent_by_account_id" IS NOT NULL
          AND "reconciliations"."received_at" IS NOT NULL AND "reconciliations"."received_by_account_id" IS NOT NULL)
      ),
	CONSTRAINT "reconciliations_discrepancy_requires_received" CHECK("reconciliations"."has_discrepancy" = 0 OR "reconciliations"."status" = 'received'),
	CONSTRAINT "reconciliations_resolution_requires_discrepancy" CHECK("reconciliations"."discrepancy_proposed_by_account_id" IS NULL OR "reconciliations"."has_discrepancy" = 1),
	CONSTRAINT "reconciliations_resolution_confirmed_requires_proposed" CHECK("reconciliations"."discrepancy_confirmed_by_account_id" IS NULL OR "reconciliations"."discrepancy_proposed_by_account_id" IS NOT NULL),
	CONSTRAINT "reconciliations_resolution_confirmer_differs_from_proposer" CHECK("reconciliations"."discrepancy_confirmed_by_account_id" IS NULL
        OR "reconciliations"."discrepancy_confirmed_by_account_id" != "reconciliations"."discrepancy_proposed_by_account_id"),
	CONSTRAINT "reconciliations_resolved_at_requires_confirmed" CHECK("reconciliations"."discrepancy_resolved_at" IS NULL OR "reconciliations"."discrepancy_confirmed_by_account_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reconciliations_count_id_unique` ON `reconciliations` (`count_id`);