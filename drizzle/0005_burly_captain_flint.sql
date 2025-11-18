CREATE TABLE `stockHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemId` int NOT NULL,
	`changeType` enum('purchase','sale','adjustment','import') NOT NULL,
	`quantityChange` int NOT NULL,
	`quantityAfter` int NOT NULL,
	`purchaseOrderId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stockHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `items` ADD `itemCode` varchar(100);--> statement-breakpoint
ALTER TABLE `items` ADD `availableQty` int DEFAULT 0 NOT NULL;