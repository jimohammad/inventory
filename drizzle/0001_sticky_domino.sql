CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`purchaseOrderId` int NOT NULL,
	`documentType` enum('delivery_note','invoice','payment_tt') NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`fileSize` int NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchaseOrderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`purchaseOrderId` int NOT NULL,
	`itemName` varchar(255) NOT NULL,
	`description` text,
	`quantity` int NOT NULL,
	`unitPrice` varchar(20) NOT NULL,
	`totalPrice` varchar(20) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `purchaseOrderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchaseOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`poNumber` varchar(100) NOT NULL,
	`supplier` varchar(255) NOT NULL,
	`currency` enum('USD','AED') NOT NULL,
	`exchangeRate` varchar(20) NOT NULL,
	`totalAmount` varchar(20) NOT NULL,
	`notes` text,
	`status` enum('draft','confirmed','completed','cancelled') NOT NULL DEFAULT 'draft',
	`orderDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchaseOrders_id` PRIMARY KEY(`id`)
);
