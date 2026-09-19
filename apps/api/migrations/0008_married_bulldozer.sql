CREATE TABLE `reconciliation_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reconciliation_id` integer NOT NULL,
	`author_account_id` integer NOT NULL,
	`body` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`reconciliation_id`) REFERENCES `reconciliations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
