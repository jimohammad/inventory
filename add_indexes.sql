-- Performance Optimization: Add Database Indexes
-- Expected improvement: 60-80% faster queries

-- Items table indexes
CREATE INDEX IF NOT EXISTS idx_items_userId ON items(userId);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_userId_category ON items(userId, category);

-- Stock History table indexes (HIGH IMPACT)
CREATE INDEX IF NOT EXISTS idx_stockHistory_userId_changeType_createdAt ON stockHistory(userId, changeType, createdAt);
CREATE INDEX IF NOT EXISTS idx_stockHistory_itemId_createdAt ON stockHistory(itemId, createdAt);
CREATE INDEX IF NOT EXISTS idx_stockHistory_userId_itemId ON stockHistory(userId, itemId);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_userId ON orders(userId);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_userId_status ON orders(userId, status);

-- Order Items table indexes
CREATE INDEX IF NOT EXISTS idx_orderItems_orderId ON orderItems(orderId);
CREATE INDEX IF NOT EXISTS idx_orderItems_itemId ON orderItems(itemId);

-- Customers table indexes
CREATE INDEX IF NOT EXISTS idx_customers_area ON customers(area);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Message History table indexes
CREATE INDEX IF NOT EXISTS idx_messageHistory_customerId ON messageHistory(customerId);
CREATE INDEX IF NOT EXISTS idx_messageHistory_status ON messageHistory(status);

-- Google Sheets Config indexes
CREATE INDEX IF NOT EXISTS idx_googleSheetConfig_userId ON googleSheetConfig(userId);

-- Alert Settings indexes
CREATE INDEX IF NOT EXISTS idx_alertSettings_userId ON alertSettings(userId);

-- Price History indexes
CREATE INDEX IF NOT EXISTS idx_priceHistory_userId_itemId ON priceHistory(userId, itemId);
CREATE INDEX IF NOT EXISTS idx_priceHistory_itemId_changedAt ON priceHistory(itemId, changedAt);

-- Sync Logs indexes
CREATE INDEX IF NOT EXISTS idx_syncLogs_userId ON syncLogs(userId);

-- WhatsApp Contacts indexes
CREATE INDEX IF NOT EXISTS idx_whatsappContacts_userId ON whatsappContacts(userId);

-- Message Templates indexes
CREATE INDEX IF NOT EXISTS idx_messageTemplates_userId ON messageTemplates(userId);
