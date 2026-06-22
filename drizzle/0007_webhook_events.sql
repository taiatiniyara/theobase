CREATE TABLE `webhook_event` (
	`id` text PRIMARY KEY NOT NULL,
	`stripe_event_id` text NOT NULL,
	`event_type` text NOT NULL,
	`processed_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `webhook_event_stripe_event_id_unique` ON `webhook_event` (`stripe_event_id`);
