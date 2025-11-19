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
  supplierInvoiceNumber: varchar("supplierInvoiceNumber", { length: 100 }),
  currency: mysqlEnum("currency", ["USD", "AED", "KWD"]).notNull(),
  exchangeRate: varchar("exchangeRate", { length: 20 }).notNull(), // Store as string to preserve precision
  exchangeRateKWD: varchar("exchangeRateKWD", { length: 20 }), // Exchange rate to KWD
  totalAmount: varchar("totalAmount", { length: 20 }).notNull(), // Store as string to preserve precision
  bankName: mysqlEnum("bankName", ["National Bank of Kuwait", "Commercial Bank of Kuwait"]),
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

/**
 * Suppliers table
 * Stores supplier information with contact details
 */
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  contactPerson: varchar("contactPerson", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

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
  sellingPrice: int("sellingPrice"),
  openingStock: int("openingStock").default(0),
  purchasePrice: int("purchasePrice"),
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
