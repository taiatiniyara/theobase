CREATE TABLE `placement_request` (
	`id` text PRIMARY KEY NOT NULL,
	`requested_by` text NOT NULL,
	`name` text NOT NULL,
	`territory` text NOT NULL,
	`suggested_parent_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`suggested_parent_id`) REFERENCES `org_unit`(`id`) ON UPDATE no action ON DELETE no action
);
