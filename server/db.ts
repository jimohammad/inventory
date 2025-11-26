import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, items, InsertItem, stockHistory, InsertStockHistory } from "../drizzle/schema";
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

import { desc } from "drizzle-orm";

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
  
  return await db.select().from(items).where(eq(items.userId, userId)).orderBy(items.name);
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

// Google Sheets configuration
export async function getGoogleSheetConfig(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const { googleSheetConfig } = await import("../drizzle/schema");
  // Optimized: fetch only needed columns
  const result = await db.select({
    id: googleSheetConfig.id,
    userId: googleSheetConfig.userId,
    spreadsheetId: googleSheetConfig.spreadsheetId,
    sheetName: googleSheetConfig.sheetName,
    serviceAccountKey: googleSheetConfig.serviceAccountKey,
    isActive: googleSheetConfig.isActive,
    createdAt: googleSheetConfig.createdAt,
    updatedAt: googleSheetConfig.updatedAt
  }).from(googleSheetConfig).where(eq(googleSheetConfig.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertGoogleSheetConfig(config: any) {
  const db = await getDb();
  if (!db) return;
  const { googleSheetConfig } = await import("../drizzle/schema");
  
  const existing = await getGoogleSheetConfig(config.userId);
  if (existing) {
    await db.update(googleSheetConfig)
      .set(config)
      .where(eq(googleSheetConfig.userId, config.userId));
  } else {
    await db.insert(googleSheetConfig).values(config);
  }
}

export async function updateLastSyncTime(userId: number) {
  const db = await getDb();
  if (!db) return;
  const { googleSheetConfig } = await import("../drizzle/schema");
  await db.update(googleSheetConfig)
    .set({ lastSyncAt: new Date() })
    .where(eq(googleSheetConfig.userId, userId));
}

// Sync logs
export async function createSyncLog(log: any) {
  const db = await getDb();
  if (!db) return;
  const { syncLogs } = await import("../drizzle/schema");
  await db.insert(syncLogs).values(log);
}

export async function getSyncLogs(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  const { syncLogs } = await import("../drizzle/schema");
  const { desc } = await import("drizzle-orm");
  return await db.select().from(syncLogs)
    .where(eq(syncLogs.userId, userId))
    .orderBy(desc(syncLogs.syncedAt))
    .limit(limit);
}

// Update item quantity by item code
export async function updateItemQuantity(userId: number, itemCode: string, quantity: number) {
  const db = await getDb();
  if (!db) return;
  const { items, stockHistory } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  
  // First, get the current quantity to detect if it's a sale
  const currentItem = await db.select()
    .from(items)
    .where(and(
      eq(items.userId, userId),
      eq(items.itemCode, itemCode)
    ))
    .limit(1);
  
  if (currentItem.length === 0) {
    console.warn(`[updateItemQuantity] Item not found: ${itemCode}`);
    return;
  }
  
  const currentQty = currentItem[0].availableQty || 0;
  const quantityChange = quantity - currentQty;
  const updateData: any = { availableQty: quantity };
  
  // If quantity decreased, it means items were sold - update lastSoldDate
  if (quantity < currentQty) {
    updateData.lastSoldDate = new Date();
    console.log(`[updateItemQuantity] Item ${itemCode} sold: ${currentQty} → ${quantity}, updating lastSoldDate`);
  }
  
  // Update item quantity
  await db.update(items)
    .set(updateData)
    .where(and(
      eq(items.userId, userId),
      eq(items.itemCode, itemCode)
    ));
  
  // Create stock history record
  const changeType = quantityChange < 0 ? "sale" : quantityChange > 0 ? "import" : "adjustment";
  await db.insert(stockHistory).values({
    userId,
    itemId: currentItem[0].id,
    changeType,
    quantityChange,
    quantityAfter: quantity,
    notes: `Google Sheets sync: ${currentQty} → ${quantity}`,
    createdAt: new Date(),
  });
  
  console.log(`[updateItemQuantity] Stock history created: ${itemCode} ${changeType} ${quantityChange} units`);
}

// WhatsApp Contacts queries
export async function getWhatsappContacts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { whatsappContacts } = await import("../drizzle/schema");
  // Optimized: fetch only needed columns
  return await db.select({
    id: whatsappContacts.id,
    userId: whatsappContacts.userId,
    name: whatsappContacts.name,
    phone: whatsappContacts.phone,
    createdAt: whatsappContacts.createdAt
  }).from(whatsappContacts)
    .where(eq(whatsappContacts.userId, userId))
    .orderBy(desc(whatsappContacts.createdAt));
}

export async function createWhatsappContact(contact: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { whatsappContacts } = await import("../drizzle/schema");
  
  const result = await db.insert(whatsappContacts).values(contact);
  return result[0].insertId;
}

export async function updateWhatsappContact(id: number, userId: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { whatsappContacts } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  
  await db.update(whatsappContacts)
    .set(updates)
    .where(and(
      eq(whatsappContacts.id, id),
      eq(whatsappContacts.userId, userId)
    ));
}

export async function deleteWhatsappContact(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { whatsappContacts } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  
  await db.delete(whatsappContacts)
    .where(and(
      eq(whatsappContacts.id, id),
      eq(whatsappContacts.userId, userId)
    ));
}
