CREATE TABLE `error_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path` text NOT NULL,
	`method` text NOT NULL,
	`message` text NOT NULL,
	`stack` text,
	`user_agent` text,
	`created_at` text DEFAULT '(datetime(''now''))' NOT NULL
);
