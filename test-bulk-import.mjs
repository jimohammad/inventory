import { drizzle } from "drizzle-orm/mysql2";
import { items } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

const testItem = {
  userId: 1,
  itemCode: 'DEBUG001',
  name: 'Debug Test Item',
  category: 'Samsung',
  purchasePrice: 100,
  sellingPrice: 150,
  availableQty: 10,
  openingStock: 10
};

console.log('Testing item insert with data:', testItem);

try {
  const result = await db.insert(items).values(testItem);
  console.log('Insert successful:', result);
} catch (error) {
  console.error('Insert failed:', error);
  console.error('Error details:', error.message);
  if (error.sql) console.error('SQL:', error.sql);
}

process.exit(0);
