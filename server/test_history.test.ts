import { describe, it, expect } from 'vitest';
import { appRouter } from './server/routers';
import { getDb } from './server/db';

describe('Stock History Feature', () => {
  it('should fetch stock history for Samsung A17 5G item', async () => {
    const db = await getDb();
    if (!db) {
      console.log('Database not available, skipping test');
      return;
    }

    // Find Samsung A17 5G 8GB/256GB item
    const { items } = await import('./drizzle/schema');
    const { eq } = await import('drizzle-orm');
    
    const [item] = await db.select().from(items).where(eq(items.itemCode, 'SM-A17568256')).limit(1);
    
    if (!item) {
      console.log('Samsung A17 5G item not found');
      return;
    }

    console.log('Found item:', item.name, 'ID:', item.id);

    // Create a mock context
    const mockCtx = {
      user: { id: item.userId, openId: 'test', role: 'user' as const },
      req: {} as any,
      res: {} as any,
    };

    // Call the getHistory procedure
    const caller = appRouter.createCaller(mockCtx);
    const result = await caller.items.getHistory({ itemId: item.id });

    console.log('History result:', JSON.stringify(result, null, 2));
    
    expect(result).toBeDefined();
    expect(result.history).toBeDefined();
    expect(result.stats).toBeDefined();
    expect(result.stats.totalSales).toBeGreaterThan(0); // Should have 50 sales
    expect(result.history.length).toBeGreaterThan(0); // Should have history entries
  });
});
