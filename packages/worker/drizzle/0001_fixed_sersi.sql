CREATE TABLE `church_extension` (
	`id` text PRIMARY KEY NOT NULL,
	`do_class` text NOT NULL,
	`address` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `org_unit`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cost_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`church_id` text NOT NULL,
	`month` integer NOT NULL,
	`do_request_count` integer DEFAULT 0 NOT NULL,
	`do_gb_seconds` real DEFAULT 0 NOT NULL,
	`d1_reads` integer DEFAULT 0 NOT NULL,
	`d1_writes` integer DEFAULT 0 NOT NULL,
	`r2_storage_bytes` integer DEFAULT 0 NOT NULL,
	`estimated_cost` real DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`church_id`) REFERENCES `church`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `error_log` (
	`id` text PRIMARY KEY NOT NULL,
	`church_id` text,
	`user_id` text,
	`severity` text NOT NULL,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`stack_trace` text,
	`breadcrumb_trail` text,
	`device_info` text,
	`timestamp` integer NOT NULL,
	`resolved` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `org_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`unit_id` text,
	`grant_id` text,
	`before` text,
	`after` text,
	`reason` text,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `org_unit`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `org_unit` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text,
	`name` text NOT NULL,
	`level` text NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'organized' NOT NULL,
	`code` text,
	`facets` text NOT NULL,
	`meta` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `org_unit`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `restore_drill` (
	`id` text PRIMARY KEY NOT NULL,
	`church_id` text NOT NULL,
	`success` integer NOT NULL,
	`duration_ms` integer NOT NULL,
	`state_hash_match` integer NOT NULL,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`church_id`) REFERENCES `church`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `role_grant` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`unit_id` text NOT NULL,
	`role` text NOT NULL,
	`expires_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `org_unit`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sync_health` (
	`id` text PRIMARY KEY NOT NULL,
	`church_id` text NOT NULL,
	`queue_depth` integer NOT NULL,
	`last_sync_at` integer NOT NULL,
	`sync_success_rate` real NOT NULL,
	`do_latency_ms` integer NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transfer` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`from_unit_id` text NOT NULL,
	`to_unit_id` text NOT NULL,
	`status` text DEFAULT 'pending-accept' NOT NULL,
	`initiated_by` text NOT NULL,
	`initiated_at` integer NOT NULL,
	`accepted_by` text,
	`accepted_at` integer,
	`rejected_by` text,
	`reason` text,
	FOREIGN KEY (`from_unit_id`) REFERENCES `org_unit`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_unit_id`) REFERENCES `org_unit`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `user` ADD `is_super_admin` integer DEFAULT false NOT NULL;