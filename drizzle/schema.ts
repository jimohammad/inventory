import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Items table
 * Stores master list of items that can be used in purchase orders
 */
export const items = mysqlTable("items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemCode: varchar("itemCode", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  category: mysqlEnum("category", ["Motorola", "Samsung", "Redmi", "Realme", "Meizu", "Honor"]),
  wholesalePrice: decimal("wholesalePrice", { precision: 10, scale: 3 }),
  retailPrice: decimal("retailPrice", { precision: 10, scale: 3 }),
  openingStock: int("openingStock").default(0),
  purchasePrice: decimal("purchasePrice", { precision: 10, scale: 3 }),
  availableQty: int("availableQty").default(0).notNull(),
  lastSoldDate: timestamp("lastSoldDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;

/**
 * Stock history table
 * Tracks all stock quantity changes for inventory analysis
 */
export const stockHistory = mysqlTable("stockHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemId: int("itemId").notNull(),
  changeType: mysqlEnum("changeType", ["purchase", "sale", "adjustment", "import"]).notNull(),
  quantityChange: int("quantityChange").notNull(),
  quantityAfter: int("quantityAfter").notNull(),
  purchaseOrderId: int("purchaseOrderId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StockHistory = typeof stockHistory.$inferSelect;
export type InsertStockHistory = typeof stockHistory.$inferInsert;

export const googleSheetConfig = mysqlTable("googleSheetConfig", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  spreadsheetId: varchar("spreadsheetId", { length: 255 }).notNull(),
  sheetName: varchar("sheetName", { length: 255 }).notNull(),
  serviceAccountKey: text("serviceAccountKey").notNull(), // JSON string
  isActive: int("isActive").default(1).notNull(), // 1 = active, 0 = inactive
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GoogleSheetConfig = typeof googleSheetConfig.$inferSelect;
export type InsertGoogleSheetConfig = typeof googleSheetConfig.$inferInsert;

export const syncLogs = mysqlTable("syncLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  status: varchar("status", { length: 50 }).notNull(), // success, failed
  itemsUpdated: int("itemsUpdated").default(0).notNull(),
  errorMessage: text("errorMessage"),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
});

export type SyncLog = typeof syncLogs.$inferSelect;
export type InsertSyncLog = typeof syncLogs.$inferInsert;

/**
 * WhatsApp Contacts table
 * Stores sales team contacts for catalog broadcasting
 */
export const whatsappContacts = mysqlTable("whatsappContacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 50 }).notNull(), // Format: +96512345678
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatsappContact = typeof whatsappContacts.$inferSelect;
export type InsertWhatsappContact = typeof whatsappContacts.$inferInsert;

/**
 * Alert Settings table
 * Stores reorder alert configuration (thresholds, notification preferences)
 */
export const alertSettings = mysqlTable("alertSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lowStockThreshold: int("lowStockThreshold").default(10).notNull(),
  criticalStockThreshold: int("criticalStockThreshold").default(5).notNull(),
  defaultReorderQuantity: int("defaultReorderQuantity").default(50).notNull(),
  emailNotificationsEnabled: int("emailNotificationsEnabled").default(0).notNull(), // 0 = disabled, 1 = enabled
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AlertSettings = typeof alertSettings.$inferSelect;
export type InsertAlertSettings = typeof alertSettings.$inferInsert;

/**
 * Price History table
 * Tracks purchase price and selling price changes over time for each item
 */
export const priceHistory = mysqlTable("priceHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemId: int("itemId").notNull(),
  purchasePrice: decimal("purchasePrice", { precision: 10, scale: 3 }),
  sellingPrice: decimal("sellingPrice", { precision: 10, scale: 3 }),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
});

export type PriceHistory = typeof priceHistory.$inferSelect;
export type InsertPriceHistory = typeof priceHistory.$inferInsert;

/**
 * Orders table
 * Stores salesman orders created from shared catalog
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  salesmanName: varchar("salesmanName", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["received", "delivered"]).default("received").notNull(),
  totalItems: int("totalItems").notNull(),
  totalQuantity: int("totalQuantity").notNull(),
  totalValue: decimal("totalValue", { precision: 12, scale: 3 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order Items table
 * Stores individual items within each order
 */
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  itemId: int("itemId").notNull(),
  itemCode: varchar("itemCode", { length: 100 }).notNull(),
  itemName: varchar("itemName", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 3 }),
  subtotal: decimal("subtotal", { precision: 12, scale: 3 }),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Customers table
 * Stores customer contacts for bulk messaging
 */
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  area: mysqlEnum("area", [
    "Sharq",
    "Margab",
    "Mubarkiya",
    "Souk Wataniya",
    "Fahaheel",
    "Jaleeb Shuwaikh",
    "Jahra",
    "Salmiya",
    "Hawally",
    "Souk Qurain",
    "Team"
  ]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * Message History table
 * Tracks all WhatsApp messages sent to customers
 */
export const messageHistory = mysqlTable("messageHistory", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MessageHistory = typeof messageHistory.$inferSelect;
export type InsertMessageHistory = typeof messageHistory.$inferInsert;

/**
 * Message Templates table
 * Stores reusable message templates for bulk messaging
 */
export const messageTemplates = mysqlTable("messageTemplates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = typeof messageTemplates.$inferInsert;
