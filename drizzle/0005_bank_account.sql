ALTER TABLE `household_member` ADD `created_at` text NOT NULL DEFAULT '';--> statement-breakpoint
CREATE TABLE `bank_account` (
	`id` text PRIMARY KEY NOT NULL,
	`congregation_id` text NOT NULL,
	`bank_name` text NOT NULL,
	`account_name` text NOT NULL,
	`account_number` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action
);
