CREATE TABLE `households` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`church_id` integer NOT NULL,
	`head_member_id` integer,
	`name` text NOT NULL,
	`address` text,
	`created_at` text DEFAULT '(datetime(''now''))' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `member_positions` (
	`member_id` integer NOT NULL,
	`position_id` integer NOT NULL,
	`start_date` text DEFAULT '(datetime(''now''))' NOT NULL,
	`end_date` text,
	PRIMARY KEY(`member_id`, `position_id`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`church_id` integer NOT NULL,
	`household_id` integer,
	`full_name` text NOT NULL,
	`preferred_name` text,
	`dob` text,
	`gender` text,
	`baptism_date` text,
	`baptism_type` text,
	`join_date` text,
	`prev_church_id` integer,
	`phone` text,
	`email` text,
	`address` text,
	`marital_status` text,
	`status` text DEFAULT 'active' NOT NULL,
	`status_date` text,
	`created_at` text DEFAULT '(datetime(''now''))' NOT NULL,
	`updated_at` text DEFAULT '(datetime(''now''))' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_members_church` ON `members` (`church_id`);--> statement-breakpoint
CREATE INDEX `idx_members_status` ON `members` (`status`);--> statement-breakpoint
CREATE TABLE `positions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`module` text DEFAULT 'core' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `positions_name_unique` ON `positions` (`name`);--> statement-breakpoint
CREATE TABLE `transfer_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`from_church_id` integer NOT NULL,
	`to_church_id` integer NOT NULL,
	`initiated_by` integer NOT NULL,
	`initiated_at` text DEFAULT '(datetime(''now''))' NOT NULL,
	`conference_approved_by` integer,
	`conference_approved_at` text,
	`accepted_by` integer,
	`accepted_at` text,
	`status` text DEFAULT 'pending_conference' NOT NULL,
	`rejection_note` text,
	`expires_at` text,
	`override_by` integer,
	`override_at` text,
	`override_action` text,
	`override_note` text
);
--> statement-breakpoint
CREATE TABLE `budget_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conference_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`fund_id` integer NOT NULL,
	`planned_amount` real NOT NULL,
	`fiscal_year` integer NOT NULL,
	`created_at` text DEFAULT '(datetime(''now''))'
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`church_id` integer NOT NULL,
	`fund_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`planned_amount` real NOT NULL,
	`fiscal_year` integer NOT NULL,
	`approved` integer DEFAULT 0,
	`approved_by` integer,
	`approved_at` text,
	`created_at` text DEFAULT '(datetime(''now''))'
);
--> statement-breakpoint
CREATE TABLE `expense_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`conference_id` integer NOT NULL,
	`active` integer DEFAULT 1,
	`created_at` text DEFAULT '(datetime(''now''))'
);
--> statement-breakpoint
CREATE TABLE `funds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`forwarding_rule` text NOT NULL,
	`conference_id` integer NOT NULL,
	`created_at` text DEFAULT '(datetime(''now''))'
);
--> statement-breakpoint
CREATE TABLE `offering_batches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`church_id` integer NOT NULL,
	`sabbath_date` text NOT NULL,
	`confirmed_by_1` integer,
	`confirmed_at_1` text,
	`confirmed_by_2` integer,
	`confirmed_at_2` text,
	`submitted_by` integer,
	`submitted_at` text,
	`status` text DEFAULT 'pending',
	`created_at` text DEFAULT '(datetime(''now''))'
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`church_id` integer NOT NULL,
	`fund_id` integer NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`description` text,
	`category_id` integer,
	`budget_ref` integer,
	`batch_id` integer,
	`created_by` integer NOT NULL,
	`created_at` text DEFAULT '(datetime(''now''))',
	`confirmed_by` integer,
	`confirmed_at` text,
	`uuid` text NOT NULL,
	`envelope_number` integer,
	`member_id` integer,
	`proxy_for_member_id` integer,
	`verified` integer DEFAULT 0,
	`verified_by` integer,
	`verified_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_uuid_unique` ON `transactions` (`uuid`);--> statement-breakpoint
CREATE TABLE `churches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`type` text NOT NULL,
	`parent_id` integer NOT NULL,
	`parent_type` text NOT NULL,
	`district_id` integer,
	`address` text,
	`bank_details` text,
	`charter_status` text,
	`founded_date` text,
	`status` text DEFAULT 'active',
	`created_at` text DEFAULT '(datetime(''now''))'
);
--> statement-breakpoint
CREATE TABLE `conferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`parent_union_id` integer,
	`address` text,
	`bank_details` text,
	`created_at` text DEFAULT '(datetime(''now''))'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `conferences_code_unique` ON `conferences` (`code`);--> statement-breakpoint
CREATE TABLE `districts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`conference_id` integer NOT NULL,
	`pastor_user_id` integer,
	`created_at` text DEFAULT '(datetime(''now''))'
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`member_id` integer,
	`conference_id` integer,
	`role` text NOT NULL,
	`reset_token` text,
	`reset_token_expires` text,
	`active` integer DEFAULT 1,
	`email_verified` integer DEFAULT 1,
	`status` text DEFAULT 'active',
	`created_at` text DEFAULT '(datetime(''now''))'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `attendance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`church_id` integer NOT NULL,
	`date` text NOT NULL,
	`count` integer NOT NULL,
	`category` text NOT NULL,
	`created_by` integer NOT NULL,
	`created_at` text DEFAULT '(datetime(''now''))',
	`updated_at` text DEFAULT '(datetime(''now''))'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unq_attendance_church_date_category` ON `attendance` (`church_id`,`date`,`category`);--> statement-breakpoint
CREATE TABLE `member_attendance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`attendance_id` integer NOT NULL,
	`member_id` integer NOT NULL,
	`created_at` text DEFAULT '(datetime(''now''))'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unq_member_attendance` ON `member_attendance` (`attendance_id`,`member_id`);--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text DEFAULT '(datetime(''now''))',
	`actor_id` integer,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer NOT NULL,
	`prev_state` text,
	`new_state` text,
	`module` text DEFAULT 'core',
	`device_info` text
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipient_user_id` integer NOT NULL,
	`type` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer NOT NULL,
	`message` text NOT NULL,
	`read` integer DEFAULT 0,
	`created_at` text DEFAULT '(datetime(''now''))'
);
--> statement-breakpoint
CREATE TABLE `reconciliations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`church_id` integer NOT NULL,
	`year` integer NOT NULL,
	`month` integer NOT NULL,
	`forwarded_tithe` real DEFAULT 0,
	`received_tithe` real,
	`tithe_discrepancy` real,
	`tithe_status` text DEFAULT 'pending',
	`tithe_note` text,
	`bank_balance` real,
	`system_balance` real,
	`bank_discrepancy` real,
	`bank_note` text,
	`reconciled_by` integer,
	`reconciled_at` text,
	`created_at` text DEFAULT '(datetime(''now''))'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unq_reconciliations_church_year_month` ON `reconciliations` (`church_id`,`year`,`month`);