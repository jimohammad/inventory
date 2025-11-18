ALTER TABLE `purchaseOrders` MODIFY COLUMN `currency` enum('USD','AED','KWD') NOT NULL;--> statement-breakpoint
ALTER TABLE `purchaseOrders` ADD `supplierInvoiceNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `purchaseOrders` ADD `exchangeRateKWD` varchar(20);--> statement-breakpoint
ALTER TABLE `purchaseOrders` ADD `bankName` enum('National Bank of Kuwait','Commercial Bank of Kuwait');