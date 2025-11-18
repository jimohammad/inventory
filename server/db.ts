import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, purchaseOrders, InsertPurchaseOrder, purchaseOrderItems, InsertPurchaseOrderItem, documents, InsertDocument, suppliers, InsertSupplier, items, InsertItem, stockHistory, InsertStockHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Purchase Order queries
import { desc } from "drizzle-orm";

export async function createPurchaseOrder(order: InsertPurchaseOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(purchaseOrders).values(order);
  return result[0].insertId;
}

export async function createPurchaseOrderItem(item: InsertPurchaseOrderItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(purchaseOrderItems).values(item);
}

export async function createDocument(doc: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(documents).values(doc);
}

export async function getPurchaseOrdersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(purchaseOrders)
    .where(eq(purchaseOrders.userId, userId))
    .orderBy(desc(purchaseOrders.createdAt));
}

export async function getPurchaseOrderById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(purchaseOrders)
    .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function getPurchaseOrderItems(purchaseOrderId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(purchaseOrderItems)
    .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));
}

export async function getDocuments(purchaseOrderId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(documents)
    .where(eq(documents.purchaseOrderId, purchaseOrderId));
}

export async function updatePurchaseOrder(id: number, userId: number, updates: Partial<InsertPurchaseOrder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(purchaseOrders)
    .set(updates)
    .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)));
}

export async function deletePurchaseOrder(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete related items and documents first
  await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id));
  await db.delete(documents).where(eq(documents.purchaseOrderId, id));
  
  // Delete the purchase order
  await db.delete(purchaseOrders)
    .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.userId, userId)));
}

export async function deletePurchaseOrderItems(purchaseOrderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId));
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(documents).where(eq(documents.id, id));
}

// Supplier queries

export async function createSupplier(supplier: InsertSupplier) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(suppliers).values(supplier);
  return result[0].insertId;
}

export async function getSuppliersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(suppliers)
    .where(eq(suppliers.userId, userId))
    .orderBy(suppliers.name);
}

export async function getSupplierById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.userId, userId)))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function updateSupplier(id: number, userId: number, updates: Partial<InsertSupplier>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(suppliers)
    .set(updates)
    .where(and(eq(suppliers.id, id), eq(suppliers.userId, userId)));
}

export async function deleteSupplier(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.userId, userId)));
}

// Items queries
export async function createItem(item: InsertItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(items).values(item);
  return result[0].insertId;
}

export async function getUserItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(items).where(eq(items.userId, userId)).orderBy(items.itemName);
}

export async function getItemById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(items)
    .where(and(eq(items.id, id), eq(items.userId, userId)))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function updateItem(id: number, userId: number, data: Partial<InsertItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(items)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(items.id, id), eq(items.userId, userId)));
}

export async function deleteItem(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(items)
    .where(and(eq(items.id, id), eq(items.userId, userId)));
}

// Stock history queries
export async function addStockHistory(history: InsertStockHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(stockHistory).values(history);
  return result[0].insertId;
}

export async function getStockHistory(itemId: number, userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(stockHistory)
    .where(and(eq(stockHistory.itemId, itemId), eq(stockHistory.userId, userId)))
    .orderBy(desc(stockHistory.createdAt))
    .limit(limit);
}

export async function getItemMovementStats(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  // Get all items with their total quantity changes in the period
  const history = await db.select({
    itemId: stockHistory.itemId,
    changeType: stockHistory.changeType,
    totalQty: stockHistory.quantityChange,
    createdAt: stockHistory.createdAt,
  })
  .from(stockHistory)
  .where(
    and(
      eq(stockHistory.userId, userId),
      and(
        eq(stockHistory.changeType, "purchase"),
      )
    )
  );
  
  return history;
}
