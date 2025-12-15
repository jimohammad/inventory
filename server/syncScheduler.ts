import * as cron from 'node-cron';
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

let scheduledTask: cron.ScheduledTask | null = null;

/**
 * Start the daily sync scheduler
 * Runs every day at 2 AM Kuwait time (11 PM UTC, which is 2 AM Kuwait time UTC+3)
 */
export function startSyncScheduler(): void {
  // Stop existing scheduler if running
  if (scheduledTask) {
    scheduledTask.stop();
  }

  // Schedule for 2 AM Kuwait time (11 PM UTC = 2 AM Kuwait time)
  // Cron format: second minute hour day month weekday
  // 0 0 23 * * * = Every day at 11 PM UTC (2 AM Kuwait time)
  scheduledTask = cron.schedule('0 0 23 * * *', async () => {
    console.log('[SyncScheduler] Running scheduled daily sync...');
    await syncAllUsers();
  }, {
    timezone: 'UTC',
  });

  scheduledTask.start();
  
  // Calculate next run time for logging
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setUTCHours(23, 0, 0, 0);
  
  // If we've passed 11 PM UTC today, schedule for tomorrow
  if (now.getUTCHours() >= 23) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  
  const kuwaitTime = nextRun.toLocaleString('en-US', {
    timeZone: 'Asia/Kuwait',
    dateStyle: 'full',
    timeStyle: 'short',
  });
  
  console.log(`[SyncScheduler] Scheduler started. Next sync at ${kuwaitTime} Kuwait time (${nextRun.toISOString()} UTC)`);
}

/**
 * Stop the sync scheduler
 */
export function stopSyncScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('[SyncScheduler] Scheduler stopped');
  }
}

/**
 * Trigger manual sync immediately (for testing)
 */
export async function triggerManualSync(): Promise<void> {
  console.log('[SyncScheduler] Manual sync triggered');
  await syncAllUsers();
}
