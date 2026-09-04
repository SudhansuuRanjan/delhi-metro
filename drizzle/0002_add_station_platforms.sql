CREATE TABLE `station_platforms` (
	`station_code` text NOT NULL,
	`line_code` text NOT NULL,
	`direction` text NOT NULL,
	`platform_no` integer NOT NULL,
	PRIMARY KEY(`station_code`, `line_code`, `direction`),
	FOREIGN KEY (`station_code`) REFERENCES `stations`(`station_code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`line_code`) REFERENCES `lines`(`line_code`) ON UPDATE no action ON DELETE cascade
);
