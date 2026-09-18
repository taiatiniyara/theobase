CREATE TABLE `church_fund_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`church_id` integer NOT NULL,
	`fund_category_id` integer NOT NULL,
	`enabled` integer NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`church_id`) REFERENCES `churches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fund_category_id`) REFERENCES `fund_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `church_fund_categories_church_category_unique` ON `church_fund_categories` (`church_id`,`fund_category_id`);--> statement-breakpoint
CREATE TABLE `fund_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mission_id` integer NOT NULL,
	`name` text NOT NULL,
	`is_tithe` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fund_categories_mission_name_unique` ON `fund_categories` (`mission_id`,`name`);