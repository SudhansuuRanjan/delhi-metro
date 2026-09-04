CREATE TABLE `station_day_timings` (
	`station_code` text NOT NULL,
	`day_group` text NOT NULL,
	`towards_code` text,
	`towards_name` text,
	`first_train_time` text,
	`last_train_time` text,
	PRIMARY KEY(`station_code`, `day_group`, `towards_code`),
	FOREIGN KEY (`station_code`) REFERENCES `stations`(`station_code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `stations` ADD `opening_time` text;--> statement-breakpoint
ALTER TABLE `stations` ADD `closing_time` text;