import { getDb } from '../db';
import { items, stockHistory } from '../../drizzle/schema';
import { eq, and, gte, lt, sql, desc } from 'drizzle-orm';

/**
 * Service for calculating daily sales summaries
 */

interface SalesSummaryData {
  date: string;
  totalItemsSold: number;
  totalRevenue: number;
  topSellingItems: Array<{
    name: string;
    code: string;
    quantitySold: number;
    revenue: number;
  }>;
  lowStockItems: Array<{
    name: string;
    code: string;
    availableQty: number;
  }>;
  noSalesItems: Array<{
    name: string;
    code: string;
  }>;
}

/**
 * Calculate sales summary for a specific date
 * @param date - Date to calculate summary for (defaults to today)
 */
export async function calculateDailySalesSummary(date?: Date): Promise<SalesSummaryData | null> {
  const db = await getDb();
  if (!db) {
    console.error('[SalesSummaryService] Database not available');
    return null;
  }

  // Use provided date or default to today
  const targetDate = date || new Date();
  
  // Set to Kuwait timezone (UTC+3)
  const kuwaitDate = new Date(targetDate.toLocaleString('en-US', { timeZone: 'Asia/Kuwait' }));
  
  // Get start and end of day in Kuwait time
  const startOfDay = new Date(kuwaitDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(kuwaitDate);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    // Get all sales (quantity decreases) for the day
    const salesData = await db
      .select({
        itemId: stockHistory.itemId,
        itemName: items.name,
        itemCode: items.itemCode,
        quantityChange: stockHistory.quantityChange,
        wholesalePrice: items.wholesalePrice,
        retailPrice: items.retailPrice,
      })
      .from(stockHistory)
      .innerJoin(items, eq(stockHistory.itemId, items.id))
      .where(
        and(
          eq(stockHistory.changeType, 'sale'),
          gte(stockHistory.createdAt, startOfDay),
          lt(stockHistory.createdAt, endOfDay)
        )
      );

    // Calculate total items sold
    const totalItemsSold = salesData.reduce((sum, sale) => sum + Math.abs(sale.quantityChange), 0);

    // Calculate total revenue (using wholesale price as default)
    const totalRevenue = salesData.reduce((sum, sale) => {
      const price = Number(sale.wholesalePrice) || 0;
      const quantity = Math.abs(sale.quantityChange);
      return sum + (price * quantity);
    }, 0);

    // Group sales by item and calculate top sellers
    const itemSalesMap = new Map<number, {
      name: string;
      code: string;
      quantitySold: number;
      revenue: number;
    }>();

    salesData.forEach(sale => {
      const existing = itemSalesMap.get(sale.itemId);
      const quantity = Math.abs(sale.quantityChange);
      const price = Number(sale.wholesalePrice) || 0;
      const revenue = price * quantity;

      if (existing) {
        existing.quantitySold += quantity;
        existing.revenue += revenue;
      } else {
        itemSalesMap.set(sale.itemId, {
          name: sale.itemName,
          code: sale.itemCode,
          quantitySold: quantity,
          revenue,
        });
      }
    });

    // Get top 5 selling items
    const topSellingItems = Array.from(itemSalesMap.values())
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    // Get low stock items (below 20 units)
    const lowStockResults = await db
      .select({
        name: items.name,
        code: items.itemCode,
        availableQty: items.availableQty,
      })
      .from(items)
      .where(lt(items.availableQty, 20))
      .orderBy(items.availableQty);

    const lowStockItems = lowStockResults.map(item => ({
      name: item.name,
      code: item.code,
      availableQty: item.availableQty,
    }));

    // Get items with no sales today
    const allItemsResults = await db
      .select({
        id: items.id,
        name: items.name,
        code: items.itemCode,
      })
      .from(items);

    const itemsWithSales = new Set(salesData.map(sale => sale.itemId));
    const noSalesItems = allItemsResults
      .filter(item => !itemsWithSales.has(item.id))
      .map(item => ({
        name: item.name,
        code: item.code,
      }));

    // Format date for display
    const formattedDate = kuwaitDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Kuwait',
    });

    return {
      date: formattedDate,
      totalItemsSold,
      totalRevenue,
      topSellingItems,
      lowStockItems,
      noSalesItems,
    };
  } catch (error) {
    console.error('[SalesSummaryService] Error calculating sales summary:', error);
    return null;
  }
}

/**
 * Get yesterday's sales summary (for daily email at 10 PM)
 */
export async function getYesterdaySalesSummary(): Promise<SalesSummaryData | null> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return calculateDailySalesSummary(yesterday);
}
