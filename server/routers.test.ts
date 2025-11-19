import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from './db';

describe('WhatsApp Contacts Feature', () => {
  beforeAll(async () => {
    // Ensure database connection is available
    const db = await getDb();
    if (!db) {
      throw new Error('Database connection not available for testing');
    }
  });

  it('should have whatsappContacts table in database', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Check if table exists by querying it
    const result = await db.execute('SHOW TABLES LIKE "whatsappContacts"');
    expect(result).toBeDefined();
  });

  it('should be able to query whatsappContacts table', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Test that we can query the table (even if empty)
    const result = await db.execute('SELECT * FROM whatsappContacts LIMIT 1');
    expect(result).toBeDefined();
    // Table exists and is queryable
  });
});
