import { importFromGoogleSheet } from './googleSheets';
import { getGoogleSheetConfig, updateLastSyncTime, createSyncLog, updateItemQuantity } from './db';

/**
 * Sync inventory from Google Sheets for a specific user
 */
export async function syncInventoryForUser(userId: number): Promise<{ success: boolean; itemsUpdated: number; error?: string }> {
  try {
    console.log(`[SyncScheduler] Starting sync for user ${userId}`);
    
    // Get user's Google Sheets configuration
    const config = await getGoogleSheetConfig(userId);
    if (!config || !config.isActive) {
      console.log(`[SyncScheduler] No active config for user ${userId}`);
      return { success: false, itemsUpdated: 0, error: 'No active Google Sheets configuration' };
    }

    // Import data from Google Sheets
    const updates = await importFromGoogleSheet({
      spreadsheetId: config.spreadsheetId,
      sheetName: config.sheetName,
      serviceAccountKey: config.serviceAccountKey,
    });

    console.log(`[SyncScheduler] Found ${updates.length} items to update`);

    // Update item quantities in database
    let itemsUpdated = 0;
    for (const update of updates) {
      try {
        await updateItemQuantity(userId, update.itemCode, update.quantity);
        itemsUpdated++;
      } catch (error) {
        console.error(`[SyncScheduler] Failed to update item ${update.itemCode}:`, error);
      }
    }

    // Update last sync time
    await updateLastSyncTime(userId);

    // Log successful sync
    await createSyncLog({
      userId,
      status: 'success',
      itemsUpdated,
      syncedAt: new Date(),
    });

    console.log(`[SyncScheduler] Sync completed for user ${userId}: ${itemsUpdated} items updated`);
    return { success: true, itemsUpdated };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[SyncScheduler] Sync failed for user ${userId}:`, error);

    // Log failed sync
    await createSyncLog({
      userId,
      status: 'failed',
      itemsUpdated: 0,
      errorMessage,
      syncedAt: new Date(),
    });

    return { success: false, itemsUpdated: 0, error: errorMessage };
  }
}

/**
 * Sync inventory for all users with active Google Sheets configuration
 */
export async function syncAllUsers(): Promise<void> {
  try {
    console.log('[SyncScheduler] Starting daily sync for all users');
    
    const { getDb } = await import('./db');
    const db = await getDb();
    if (!db) {
      console.error('[SyncScheduler] Database not available');
      return;
    }

    const { googleSheetConfig } = await import('../drizzle/schema');
    const { eq } = await import('drizzle-orm');
    
    // Get all active configurations
    const configs = await db.select()
      .from(googleSheetConfig)
      .where(eq(googleSheetConfig.isActive, 1));

    console.log(`[SyncScheduler] Found ${configs.length} active configurations`);

    // Sync each user
    for (const config of configs) {
      await syncInventoryForUser(config.userId);
      // Add small delay between users to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('[SyncScheduler] Daily sync completed for all users');
  } catch (error) {
    console.error('[SyncScheduler] Failed to sync all users:', error);
  }
}

/**
 * Start the daily sync scheduler
 * Runs every day at 2 AM Kuwait time (UTC+3)
 */
export function startSyncScheduler(): void {
  // Calculate time until next 2 AM Kuwait time
  const now = new Date();
  
  // Get current time in Kuwait (UTC+3)
  const kuwaitOffset = 3 * 60; // Kuwait is UTC+3
  const localOffset = now.getTimezoneOffset(); // Server's offset from UTC in minutes
  const kuwaitTime = new Date(now.getTime() + (kuwaitOffset + localOffset) * 60 * 1000);
  
  // Set target time to 2 AM Kuwait time
  const next2AMKuwait = new Date(kuwaitTime);
  next2AMKuwait.setHours(2, 0, 0, 0);
  
  // If it's already past 2 AM today in Kuwait, schedule for tomorrow
  if (kuwaitTime > next2AMKuwait) {
    next2AMKuwait.setDate(next2AMKuwait.getDate() + 1);
  }
  
  // Convert back to server time
  const next2AMServer = new Date(next2AMKuwait.getTime() - (kuwaitOffset + localOffset) * 60 * 1000);
  const msUntil2AM = next2AMServer.getTime() - now.getTime();

  console.log(`[SyncScheduler] Scheduler started. Next sync at ${next2AMKuwait.toISOString()} Kuwait time (${next2AMServer.toISOString()} server time)`);

  // Schedule first run
  setTimeout(() => {
    syncAllUsers();
    
    // Then run every 24 hours
    setInterval(() => {
      syncAllUsers();
    }, 24 * 60 * 60 * 1000);
  }, msUntil2AM);
}
