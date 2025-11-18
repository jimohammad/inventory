import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
 * Purchase Orders table
 * Stores main purchase order information including currency and exchange rate
 */
export const purchaseOrders = mysqlTable("purchaseOrders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  poNumber: varchar("poNumber", { length: 100 }).notNull(),
  supplier: varchar("supplier", { length: 255 }).notNull(),
  currency: mysqlEnum("currency", ["USD", "AED"]).notNull(),
  exchangeRate: varchar("exchangeRate", { length: 20 }).notNull(), // Store as string to preserve precision
  totalAmount: varchar("totalAmount", { length: 20 }).notNull(), // Store as string to preserve precision
  notes: text("notes"),
  status: mysqlEnum("status", ["draft", "confirmed", "completed", "cancelled"]).default("draft").notNull(),
  orderDate: timestamp("orderDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;

/**
 * Purchase Order Items table
 * Stores individual items within each purchase order
 */
export const purchaseOrderItems = mysqlTable("purchaseOrderItems", {
  id: int("id").autoincrement().primaryKey(),
  purchaseOrderId: int("purchaseOrderId").notNull(),
  itemName: varchar("itemName", { length: 255 }).notNull(),
  description: text("description"),
  quantity: int("quantity").notNull(),
  unitPrice: varchar("unitPrice", { length: 20 }).notNull(), // Store as string to preserve precision
  totalPrice: varchar("totalPrice", { length: 20 }).notNull(), // Store as string to preserve precision
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type InsertPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;

/**
 * Documents table
 * Stores uploaded documents (delivery notes, invoices, payment TT) for purchase orders
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  purchaseOrderId: int("purchaseOrderId").notNull(),
  documentType: mysqlEnum("documentType", ["delivery_note", "invoice", "payment_tt"]).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  fileSize: int("fileSize").notNull(), // in bytes
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;