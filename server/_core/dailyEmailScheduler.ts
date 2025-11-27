import cron from 'node-cron';
import { calculateDailySalesSummary } from './salesSummaryService';
import { sendDailySalesSummary } from './emailService';

/**
 * Daily email scheduler
 * Sends sales summary email at 10 PM Kuwait time (7 PM UTC)
 */

let scheduledTask: cron.ScheduledTask | null = null;

/**
 * Start the daily email scheduler
 */
export function startDailyEmailScheduler() {
  // Stop existing scheduler if running
  if (scheduledTask) {
    scheduledTask.stop();
  }

  // Schedule for 10 PM Kuwait time (7 PM UTC)
  // Cron format: second minute hour day month weekday
  // 0 0 19 * * * = Every day at 7 PM UTC (10 PM Kuwait time)
  scheduledTask = cron.schedule('0 0 19 * * *', async () => {
    console.log('[DailyEmailScheduler] Running daily sales summary email job...');
    
    try {
      // Calculate today's sales summary
      const summary = await calculateDailySalesSummary();
      
      if (!summary) {
        console.error('[DailyEmailScheduler] Failed to calculate sales summary');
        return;
      }
      
      // Send email
      const success = await sendDailySalesSummary(summary);
      
      if (success) {
        console.log('[DailyEmailScheduler] Daily sales summary email sent successfully');
      } else {
        console.error('[DailyEmailScheduler] Failed to send daily sales summary email');
      }
    } catch (error) {
      console.error('[DailyEmailScheduler] Error in daily email job:', error);
    }
  }, {
    timezone: 'UTC',
  });

  scheduledTask.start();
  
  // Calculate next run time
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setUTCHours(19, 0, 0, 0);
  
  // If we've passed 7 PM UTC today, schedule for tomorrow
  if (now.getUTCHours() >= 19) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  
  const kuwaitTime = nextRun.toLocaleString('en-US', {
    timeZone: 'Asia/Kuwait',
    dateStyle: 'full',
    timeStyle: 'short',
  });
  
  console.log(`[DailyEmailScheduler] Scheduler started. Next email at ${kuwaitTime} Kuwait time (${nextRun.toISOString()} UTC)`);
}

/**
 * Stop the daily email scheduler
 */
export function stopDailyEmailScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('[DailyEmailScheduler] Scheduler stopped');
  }
}

/**
 * Send test email immediately (for testing purposes)
 */
export async function sendTestEmail() {
  console.log('[DailyEmailScheduler] Sending test email...');
  
  try {
    const summary = await calculateDailySalesSummary();
    
    if (!summary) {
      console.error('[DailyEmailScheduler] Failed to calculate sales summary');
      return false;
    }
    
    const success = await sendDailySalesSummary(summary);
    
    if (success) {
      console.log('[DailyEmailScheduler] Test email sent successfully');
    } else {
      console.error('[DailyEmailScheduler] Failed to send test email');
    }
    
    return success;
  } catch (error) {
    console.error('[DailyEmailScheduler] Error sending test email:', error);
    return false;
  }
}
