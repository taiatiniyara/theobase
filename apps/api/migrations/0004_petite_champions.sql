CREATE TABLE `count_lines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`count_id` integer NOT NULL,
	`fund_category_id` integer NOT NULL,
	`amount_cents` integer NOT NULL,
	FOREIGN KEY (`count_id`) REFERENCES `counts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fund_category_id`) REFERENCES `fund_categories`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "count_lines_amount_non_negative" CHECK("count_lines"."amount_cents" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `count_lines_count_category_unique` ON `count_lines` (`count_id`,`fund_category_id`);--> statement-breakpoint
CREATE TABLE `counts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_record_id` text NOT NULL,
	`church_id` integer NOT NULL,
	`entered_by_account_id` integer NOT NULL,
	`sabbath_date` text NOT NULL,
	`recorded_at` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`church_id`) REFERENCES `churches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`entered_by_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `counts_client_record_id_unique` ON `counts` (`client_record_id`);