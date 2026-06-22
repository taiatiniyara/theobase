CREATE TABLE `subscription_plan` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`stripe_price_id` text NOT NULL,
	`stripe_product_id` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL DEFAULT 'usd',
	`interval` text NOT NULL,
	`features` text,
	`active` integer NOT NULL DEFAULT 1,
	`sort_order` integer NOT NULL DEFAULT 0,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_plan_stripe_price_id_unique` ON `subscription_plan` (`stripe_price_id`);--> statement-breakpoint
CREATE TABLE `subscription` (
	`id` text PRIMARY KEY NOT NULL,
	`congregation_id` text NOT NULL,
	`stripe_subscription_id` text NOT NULL,
	`stripe_customer_id` text NOT NULL,
	`plan_id` text,
	`status` text NOT NULL,
	`current_period_start` text NOT NULL,
	`current_period_end` text NOT NULL,
	`cancel_at_period_end` integer NOT NULL DEFAULT 0,
	`canceled_at` text,
	`trial_end` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`plan_id`) REFERENCES `subscription_plan`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_congregation_id_unique` ON `subscription` (`congregation_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscription_stripe_subscription_id_unique` ON `subscription` (`stripe_subscription_id`);--> statement-breakpoint
CREATE INDEX `subscription_congregation_idx` ON `subscription` (`congregation_id`);--> statement-breakpoint
CREATE INDEX `subscription_stripe_idx` ON `subscription` (`stripe_subscription_id`);
