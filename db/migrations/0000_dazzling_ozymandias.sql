CREATE TABLE `farms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`owner_name` text,
	`owner_phone` text,
	`address` text,
	`lat` real,
	`lng` real,
	`size_ha` real,
	`color_token` text,
	`notes` text,
	`payment_type` text DEFAULT 'none',
	`visit_amount` real,
	`monthly_amount` real,
	`monthly_due_day` integer,
	`commission_pct` real,
	`visit_frequency` text DEFAULT 'weekly',
	`visit_week_of_month` integer,
	`visit_biweekly_parity` text,
	`deleted_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`note_id` integer NOT NULL,
	`type` text NOT NULL,
	`file_path` text NOT NULL,
	`duration_sec` real,
	`transcript` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`visit_id` integer NOT NULL,
	`title` text,
	`kind` text DEFAULT 'other',
	`note_text` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`farm_id` integer NOT NULL,
	`amount` real NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`due_date` text,
	`paid_date` text,
	`sale_amount` real,
	`pct` real,
	`notes` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `skipped_visits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`farm_id` integer NOT NULL,
	`week_id` integer NOT NULL,
	`reason` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`week_id`) REFERENCES `weeks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sync_queue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`table_name` text NOT NULL,
	`row_id` integer NOT NULL,
	`op` text NOT NULL,
	`synced` integer DEFAULT false,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`biometric_enabled` integer DEFAULT false,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `visits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`farm_id` integer NOT NULL,
	`week_id` integer NOT NULL,
	`visited_date` text NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`week_id`) REFERENCES `weeks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `weeks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year` integer NOT NULL,
	`week_number` integer NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL
);
