CREATE TABLE `nominating_ballot` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`role_id` text NOT NULL,
	`candidate_id` text,
	`voter_id` text NOT NULL,
	`encrypted_vote` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `nominating_session`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`role_id`) REFERENCES `nominating_role`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`candidate_id`) REFERENCES `nominating_candidate`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`voter_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `nominating_ballot_session_idx` ON `nominating_ballot` (`session_id`);--> statement-breakpoint
CREATE INDEX `nominating_ballot_role_idx` ON `nominating_ballot` (`role_id`);--> statement-breakpoint
CREATE INDEX `nominating_ballot_voter_idx` ON `nominating_ballot` (`voter_id`);
