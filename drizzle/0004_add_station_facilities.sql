CREATE TABLE `station_facilities` (
	`station_code` text PRIMARY KEY NOT NULL,
	`description` text,
	`mobile` text,
	`landline` text,
	`amenities` text,
	`gates` text,
	`lifts` text,
	`parking` text,
	FOREIGN KEY (`station_code`) REFERENCES `stations`(`station_code`) ON UPDATE no action ON DELETE cascade
);
