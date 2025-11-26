// Optimized items.list query - replace lines 23-76 in routers.ts

list: protectedProcedure.query(async ({ ctx }) => {
  const { getDb } = await import("./db");
  const db = await getDb();
  
  if (!db) return [];
  
  // Optimized single query with LEFT JOIN for sales velocity
  const { items, stockHistory } = await import("../drizzle/schema");
  const { eq, and, sql } = await import("drizzle-orm");
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Single optimized query with aggregation in database
  const result = await db
    .select({
      // Item fields
      id: items.id,
      userId: items.userId,
      itemCode: items.itemCode,
      name: items.name,
      category: items.category,
      wholesalePrice: items.wholesalePrice,
      retailPrice: items.retailPrice,
      purchasePrice: items.purchasePrice,
      foreignCurrency: items.foreignCurrency,
      foreignCurrencyPrice: items.foreignCurrencyPrice,
      availableQty: items.availableQty,
      openingStock: items.openingStock,
      lastSoldDate: items.lastSoldDate,
      createdAt: items.createdAt,
      updatedAt: items.updatedAt,
      // Aggregated sales data (calculated in database)
      totalSold: sql<number>`COALESCE(SUM(CASE 
        WHEN ${stockHistory.changeType} = 'sale' 
        AND ${stockHistory.createdAt} >= ${thirtyDaysAgo} 
        THEN ABS(${stockHistory.quantityChange}) 
        ELSE 0 
      END), 0)`,
    })
    .from(items)
    .leftJoin(
      stockHistory,
      and(
        eq(items.id, stockHistory.itemId),
        eq(stockHistory.userId, ctx.user.id)
      )
    )
    .where(eq(items.userId, ctx.user.id))
    .groupBy(items.id);
  
  // Calculate velocity in single pass
  return result.map(item => {
    const soldLast30Days = Number(item.totalSold) || 0;
    const salesVelocity = (soldLast30Days / 30) * 7; // units per week
    
    let velocityStatus: "fast" | "moderate" | "slow" | "none" = "none";
    if (salesVelocity >= 3) {
      velocityStatus = "fast";
    } else if (salesVelocity >= 1) {
      velocityStatus = "moderate";
    } else if (salesVelocity > 0) {
      velocityStatus = "slow";
    }
    
    return {
      ...item,
      salesVelocity: Number(salesVelocity.toFixed(1)),
      velocityStatus,
    };
  });
}),
