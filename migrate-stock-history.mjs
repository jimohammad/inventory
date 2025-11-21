import { drizzle } from "drizzle-orm/mysql2";
import { items, stockHistory } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

async function migrateStockHistory() {
  console.log("Starting stock history migration...");
  
  try {
    // Get all items
    const allItems = await db.select().from(items);
    console.log(`Found ${allItems.length} items to process`);
    
    let processed = 0;
    let created = 0;
    
    for (const item of allItems) {
      const openingStock = item.openingStock || 0;
      const availableQty = item.availableQty || 0;
      const soldQty = openingStock - availableQty;
      
      if (soldQty > 0) {
        // Create stock history record for sales
        await db.insert(stockHistory).values({
          userId: item.userId,
          itemId: item.id,
          changeType: "sale",
          quantityChange: -soldQty,
          quantityAfter: availableQty,
          notes: `Historical sales migration: ${openingStock} opening - ${availableQty} available = ${soldQty} sold`,
          createdAt: new Date(),
        });
        
        // Update lastSoldDate
        await db.update(items)
          .set({ lastSoldDate: new Date() })
          .where(eq(items.id, item.id));
        
        console.log(`✓ ${item.itemCode} (${item.name}): ${soldQty} units sold`);
        created++;
      }
      
      processed++;
    }
    
    console.log(`\nMigration complete!`);
    console.log(`Processed: ${processed} items`);
    console.log(`Created: ${created} stock history records`);
    
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

migrateStockHistory();
