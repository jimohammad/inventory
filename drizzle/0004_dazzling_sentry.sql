CREATE TABLE `items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemName` varchar(255) NOT NULL,
	`category` varchar(100),
	`description` text,
	`defaultUnitPrice` varchar(20),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `items_id` PRIMARY KEY(`id`)
);
