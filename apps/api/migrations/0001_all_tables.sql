CREATE TABLE `av_order_of_service` (
	`id` text PRIMARY KEY NOT NULL,
	`congregation_id` text NOT NULL,
	`date` text NOT NULL,
	`items` text NOT NULL,
	`updated_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `board_decision` (
	`id` text PRIMARY KEY NOT NULL,
	`meeting_id` text NOT NULL,
	`number` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`mover_id` text,
	`seconder_id` text,
	`vote_outcome` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`meeting_id`) REFERENCES `board_meeting`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`mover_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`seconder_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `board_meeting` (
	`id` text PRIMARY KEY NOT NULL,
	`congregation_id` text NOT NULL,
	`date` text NOT NULL,
	`agenda` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `board_minute` (
	`id` text PRIMARY KEY NOT NULL,
	`meeting_id` text NOT NULL,
	`content` text NOT NULL,
	`revision_number` integer DEFAULT 1 NOT NULL,
	`author_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`meeting_id`) REFERENCES `board_meeting`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `candidacy` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`congregation_id` text NOT NULL,
	`stage` text NOT NULL,
	`start_date` text NOT NULL,
	`decision_date` text,
	`decision_type` text,
	`officiating_pastor_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`officiating_pastor_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `communion_inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`service_id` text NOT NULL,
	`item` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit` text NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `communion_service`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `communion_room` (
	`id` text PRIMARY KEY NOT NULL,
	`service_id` text NOT NULL,
	`name` text NOT NULL,
	`gender` text NOT NULL,
	`volunteer_ids` text,
	FOREIGN KEY (`service_id`) REFERENCES `communion_service`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `communion_service` (
	`id` text PRIMARY KEY NOT NULL,
	`congregation_id` text NOT NULL,
	`date` text NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `congregation_asset` (
	`id` text PRIMARY KEY NOT NULL,
	`congregation_id` text NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'operational' NOT NULL,
	`updated_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `district` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`organization_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `district_congregation` (
	`id` text PRIMARY KEY NOT NULL,
	`district_id` text NOT NULL,
	`congregation_id` text NOT NULL,
	FOREIGN KEY (`district_id`) REFERENCES `district`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `duty_slot` (
	`id` text PRIMARY KEY NOT NULL,
	`congregation_id` text NOT NULL,
	`date` text NOT NULL,
	`role` text NOT NULL,
	`volunteer_id` text,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`volunteer_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `expense` (
	`id` text PRIMARY KEY NOT NULL,
	`congregation_id` text NOT NULL,
	`amount` integer NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`receipt_id` text,
	`board_decision_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`receipt_id`) REFERENCES `receipt`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`board_decision_id`) REFERENCES `board_decision`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `facility_booking` (
	`id` text PRIMARY KEY NOT NULL,
	`congregation_id` text NOT NULL,
	`date` text NOT NULL,
	`time_start` text NOT NULL,
	`time_end` text NOT NULL,
	`purpose` text NOT NULL,
	`requester_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requester_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `health_contact` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`congregation_id` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`interests` text,
	`follow_up_status` text DEFAULT 'new' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `health_event`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `health_event` (
	`id` text PRIMARY KEY NOT NULL,
	`congregation_id` text NOT NULL,
	`name` text NOT NULL,
	`date` text NOT NULL,
	`type` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `household` (
	`id` text PRIMARY KEY NOT NULL,
	`congregation_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `household_member` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text NOT NULL,
	`person_id` text NOT NULL,
	`relationship` text NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `household`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `nominating_candidate` (
	`id` text PRIMARY KEY NOT NULL,
	`role_id` text NOT NULL,
	`person_id` text NOT NULL,
	`nominated_by_id` text,
	`status` text DEFAULT 'nominated' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `nominating_role`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`nominated_by_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `nominating_role` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`role_type` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `nominating_session`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `nominating_session` (
	`id` text PRIMARY KEY NOT NULL,
	`congregation_id` text NOT NULL,
	`year` integer NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`opened_by_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`opened_by_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pantry_item` (
	`id` text PRIMARY KEY NOT NULL,
	`congregation_id` text NOT NULL,
	`name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit` text NOT NULL,
	`updated_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pastoral_visit` (
	`id` text PRIMARY KEY NOT NULL,
	`household_id` text,
	`pastor_id` text NOT NULL,
	`congregation_id` text NOT NULL,
	`date` text NOT NULL,
	`purpose` text,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `household`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`pastor_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pathfinder_honor` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`earned_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pathfinder_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`class_name` text NOT NULL,
	`club_type` text NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`completed_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `preaching_rotation` (
	`id` text PRIMARY KEY NOT NULL,
	`congregation_id` text NOT NULL,
	`date` text NOT NULL,
	`preacher_id` text NOT NULL,
	`topic` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`preacher_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `receipt` (
	`id` text PRIMARY KEY NOT NULL,
	`congregation_id` text NOT NULL,
	`member_id` text NOT NULL,
	`amount` integer NOT NULL,
	`fund_split` text NOT NULL,
	`image_key` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`verified_by_id` text,
	`verified_at` text,
	`rejection_note` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`verified_by_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sabbath_school_attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`date` text NOT NULL,
	`member_id` text NOT NULL,
	`present` integer NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `sabbath_school_class`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sabbath_school_class` (
	`id` text PRIMARY KEY NOT NULL,
	`congregation_id` text NOT NULL,
	`division` text NOT NULL,
	`name` text NOT NULL,
	`teacher_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `safety_clearance` (
	`id` text PRIMARY KEY NOT NULL,
	`volunteer_id` text NOT NULL,
	`congregation_id` text NOT NULL,
	`type` text NOT NULL,
	`issued_date` text NOT NULL,
	`expiry_date` text NOT NULL,
	`certificate_key` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`volunteer_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transfer_request` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`from_congregation_id` text NOT NULL,
	`to_congregation_id` text NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`requested_by_id` text,
	`approved_by_id` text,
	`received_by_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`from_congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`received_by_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `welfare_case` (
	`id` text PRIMARY KEY NOT NULL,
	`congregation_id` text NOT NULL,
	`person_id` text,
	`assistance_type` text NOT NULL,
	`description` text NOT NULL,
	`value` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`congregation_id`) REFERENCES `congregation`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`person_id`) REFERENCES `person`(`id`) ON UPDATE no action ON DELETE no action
);
