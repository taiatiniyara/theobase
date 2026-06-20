ALTER TABLE `auth_token` ADD `two_factor_code` text;--> statement-breakpoint
ALTER TABLE `auth_token` ADD `two_factor_expires_at` text;--> statement-breakpoint
CREATE TABLE `discipline_case` (
	`id` text PRIMARY KEY NOT NULL,
	`congregation_id` text NOT NULL,
	`person_id` text NOT NULL,
	`case_type` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`description` text NOT NULL,
	`resolution` text,
	`decided_by_id` text,
	`decided_at` text,
	`board_meeting_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`decided_by_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`board_meeting_id`) REFERENCES `board_meeting`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE INDEX `discipline_case_congregation_idx` ON `discipline_case` (`congregation_id`);
