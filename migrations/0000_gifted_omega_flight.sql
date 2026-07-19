CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`organization_id` text,
	`actor_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`before_values` text,
	`after_values` text,
	`created_at` text DEFAULT '(datetime('now'))' NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `balances` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`fund_type` text NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT '(datetime('now'))' NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `expense_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`code` text,
	`parent_id` text,
	`created_at` text DEFAULT '(datetime('now'))' NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parent_id`) REFERENCES `expense_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`category_id` text,
	`amount` real NOT NULL,
	`payee` text NOT NULL,
	`expense_date` text NOT NULL,
	`notes` text,
	`created_by` text,
	`created_at` text DEFAULT '(datetime('now'))' NOT NULL,
	`updated_at` text DEFAULT '(datetime('now'))' NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `expense_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `fiscal_periods` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`year` integer NOT NULL,
	`start_month` integer NOT NULL,
	`created_at` text DEFAULT '(datetime('now'))' NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `fund_allocations` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`destination_org_id` text NOT NULL,
	`amount` real NOT NULL,
	`percentage` integer,
	`created_at` text DEFAULT '(datetime('now'))' NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`destination_org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `households` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`head_of_household_id` text,
	`created_at` text DEFAULT '(datetime('now'))' NOT NULL,
	`updated_at` text DEFAULT '(datetime('now'))' NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`head_of_household_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `member_transfers` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`member_id` text NOT NULL,
	`sending_org_id` text NOT NULL,
	`receiving_org_id` text NOT NULL,
	`status` text DEFAULT 'pending_sending_approval' NOT NULL,
	`sending_board_vote_date` text,
	`receiving_board_vote_date` text,
	`initiated_by` text NOT NULL,
	`rejection_reason` text,
	`created_at` text DEFAULT '(datetime('now'))' NOT NULL,
	`updated_at` text DEFAULT '(datetime('now'))' NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sending_org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`receiving_org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`initiated_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`date_of_birth` text,
	`gender` text,
	`phone` text,
	`address` text,
	`email` text,
	`password_hash` text,
	`email_verified` integer DEFAULT false,
	`reset_token` text,
	`reset_token_expires` text,
	`verification_token` text,
	`membership_status` text DEFAULT 'active' NOT NULL,
	`baptism_date` text,
	`profession_of_faith_date` text,
	`original_join_date` text,
	`role` text,
	`guardian_id` text,
	`household_id` text,
	`created_at` text DEFAULT '(datetime('now'))' NOT NULL,
	`updated_at` text DEFAULT '(datetime('now'))' NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`guardian_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `offering_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`local_church_pct` integer NOT NULL,
	`district_pct` integer DEFAULT 0 NOT NULL,
	`mission_pct` integer DEFAULT 0 NOT NULL,
	`conference_pct` integer DEFAULT 0 NOT NULL,
	`union_pct` integer DEFAULT 0 NOT NULL,
	`division_pct` integer DEFAULT 0 NOT NULL,
	`gc_pct` integer DEFAULT 20 NOT NULL,
	`created_at` text DEFAULT '(datetime('now'))' NOT NULL,
	`updated_at` text DEFAULT '(datetime('now'))' NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`parent_id` text,
	`address` text,
	`phone` text,
	`email` text,
	`service_times` text,
	`pastor_name` text,
	`created_at` text DEFAULT '(datetime('now'))' NOT NULL,
	`updated_at` text DEFAULT '(datetime('now'))' NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parent_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `remittance_items` (
	`id` text PRIMARY KEY NOT NULL,
	`remittance_id` text NOT NULL,
	`fund_type` text NOT NULL,
	`amount_collected` real NOT NULL,
	`amount_retained` real NOT NULL,
	`amount_remitted` real NOT NULL,
	`created_at` text DEFAULT '(datetime('now'))' NOT NULL,
	FOREIGN KEY (`remittance_id`) REFERENCES `remittances`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `remittances` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`source_org_id` text NOT NULL,
	`destination_org_id` text NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`total_amount` real NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`submitted_by` text,
	`submitted_at` text,
	`confirmed_at` text,
	`created_at` text DEFAULT '(datetime('now'))' NOT NULL,
	`updated_at` text DEFAULT '(datetime('now'))' NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`destination_org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`submitted_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`dasherized_name` text NOT NULL,
	`created_at` text DEFAULT '(datetime('now'))' NOT NULL,
	`updated_at` text DEFAULT '(datetime('now'))' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`member_id` text,
	`fund_type` text NOT NULL,
	`offering_sub_category` text,
	`amount` real NOT NULL,
	`transaction_date` text NOT NULL,
	`notes` text,
	`created_by` text,
	`batch_id` text,
	`is_synced` integer DEFAULT true,
	`created_at` text DEFAULT '(datetime('now'))' NOT NULL,
	`updated_at` text DEFAULT '(datetime('now'))' NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_email_unique` ON `members` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_dasherized_name_unique` ON `tenants` (`dasherized_name`);