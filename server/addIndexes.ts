import { drizzle } from "drizzle-orm/mysql2";

async function addIndexes() {
  const db = drizzle(process.env.DATABASE_URL!);
  
  console.log("Adding database indexes for performance optimization...");
  
  try {
    // Add indexes for purchase orders
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_user_id ON purchaseOrders(userId);
    `);
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchaseOrders(supplier);
    `);
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchaseOrders(orderDate);
    `);
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchaseOrders(status);
    `);
    
    // Add indexes for items
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(userId);
    `);
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
    `);
    
    // Add indexes for suppliers
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(userId);
    `);
    
    // Add indexes for stock history
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_stock_history_item_id ON stockHistory(itemId);
    `);
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_stock_history_created_at ON stockHistory(createdAt);
    `);
    
    console.log("✓ Database indexes added successfully");
  } catch (error) {
    console.error("Error adding indexes:", error);
    throw error;
  }
}

addIndexes()
  .then(() => {
    console.log("Index migration completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Index migration failed:", error);
    process.exit(1);
  });
