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
  sellingPrice: decimal("sellingPrice", { precision: 10, scale: 3 }),
  openingStock: int("openingStock").default(0),
  purchasePrice: decimal("purchasePrice", { precision: 10, scale: 3 }),
  availableQty: int("availableQty").default(0).notNull(),
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
