CREATE TABLE `edges` (
	`from_code` text NOT NULL,
	`to_code` text NOT NULL,
	`line_code` text NOT NULL,
	`time_min` real NOT NULL,
	`distance_km` real NOT NULL,
	PRIMARY KEY(`from_code`, `to_code`, `line_code`),
	FOREIGN KEY (`from_code`) REFERENCES `stations`(`station_code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_code`) REFERENCES `stations`(`station_code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`line_code`) REFERENCES `lines`(`line_code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `fare_brackets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`max_distance_km` real NOT NULL,
	`fare` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lines` (
	`line_code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`line_color` text NOT NULL,
	`primary_color_code` text,
	`secondary_color_code` text,
	`start_station` text,
	`end_station` text,
	`show_in_frontend` integer DEFAULT true,
	`status` text,
	`order_index` integer
);
--> statement-breakpoint
CREATE TABLE `station_lines` (
	`station_code` text NOT NULL,
	`line_code` text NOT NULL,
	`order_index` integer,
	PRIMARY KEY(`station_code`, `line_code`),
	FOREIGN KEY (`station_code`) REFERENCES `stations`(`station_code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`line_code`) REFERENCES `lines`(`line_code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `station_timings` (
	`station_code` text PRIMARY KEY NOT NULL,
	`first_train` text,
	`last_train` text,
	FOREIGN KEY (`station_code`) REFERENCES `stations`(`station_code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `stations` (
	`station_code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`commercial_name` text,
	`latitude` real,
	`longitude` real,
	`x_coords` real,
	`y_coords` real,
	`station_type` text,
	`interchange` integer DEFAULT false,
	`status` text
);
--> statement-breakpoint
CREATE TABLE `sync_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text,
	`updated_at` integer NOT NULL
);
