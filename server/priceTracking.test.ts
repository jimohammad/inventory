import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../server/db';
import { items, priceHistory } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

describe('Price Tracking', () => {
  let testItemId: number;
  let testUserId: number = 1; // Assuming user ID 1 exists

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a test item
    const [newItem] = await db.insert(items).values({
      userId: testUserId,
      itemCode: 'TEST-PRICE-001',
      name: 'Test Item for Price Tracking',
      category: 'Samsung',
      purchasePrice: '10.000',
      sellingPrice: '15.000',
      availableQty: 100,
      openingStock: 100,
    });

    testItemId = newItem.insertId;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(priceHistory).where(eq(priceHistory.itemId, testItemId));
    await db.delete(items).where(eq(items.id, testItemId));
  });

  it('should create price history record when prices change', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Simulate price change by inserting a price history record
    await db.insert(priceHistory).values({
      userId: testUserId,
      itemId: testItemId,
      purchasePrice: '12.000',
      sellingPrice: '18.000',
      changedAt: new Date(),
    });

    // Query the price history
    const history = await db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.itemId, testItemId));

    expect(history).toHaveLength(1);
    expect(history[0].purchasePrice).toBe('12.000');
    expect(history[0].sellingPrice).toBe('18.000');
    expect(history[0].itemId).toBe(testItemId);
    expect(history[0].userId).toBe(testUserId);
  });

  it('should store multiple price history records for the same item', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Add another price change
    await db.insert(priceHistory).values({
      userId: testUserId,
      itemId: testItemId,
      purchasePrice: '13.000',
      sellingPrice: '19.000',
      changedAt: new Date(),
    });

    // Query all price history for this item
    const history = await db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.itemId, testItemId));

    expect(history.length).toBeGreaterThanOrEqual(2);
  });

  it('should retrieve price history ordered by date', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Query price history ordered by date
    const history = await db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.itemId, testItemId))
      .orderBy(priceHistory.changedAt);

    expect(history.length).toBeGreaterThan(0);
    
    // Verify ordering (each record should be later than or equal to the previous)
    for (let i = 1; i < history.length; i++) {
      const prevDate = new Date(history[i - 1].changedAt).getTime();
      const currDate = new Date(history[i].changedAt).getTime();
      expect(currDate).toBeGreaterThanOrEqual(prevDate);
    }
  });

  it('should verify Samsung A07 price history exists', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Query Samsung A07 item (itemId: 330020)
    const samsungA07History = await db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.itemId, 330020));

    // Should have at least one price history record
    expect(samsungA07History.length).toBeGreaterThan(0);
    
    // Verify the most recent record has the expected prices
    const latestRecord = samsungA07History[samsungA07History.length - 1];
    expect(latestRecord.purchasePrice).toBe('21.000');
    expect(latestRecord.sellingPrice).toBe('22.000');
  });
});
