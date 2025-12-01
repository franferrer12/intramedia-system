import db from '../config/database.js';
import scraperService from './socialMediaScraperService.js';
import emailService from './emailService.js';
import Notification from '../models/Notification.js';

/**
 * Scheduled Jobs Service
 * Handles automatic updates and maintenance tasks
 */

let jobIntervals = [];

/**
 * Update social media metrics for all active DJs
 */
async function updateAllSocialMediaMetrics() {
  console.log('');
  console.log('🔄 [Scheduled Job] Starting social media metrics update...');
  console.log(`📅 Time: ${new Date().toISOString()}`);

  try {
    // Get all active social media accounts
    const result = await db.query(
      `SELECT DISTINCT ON (dj_id, platform)
        id,
        dj_id,
        platform,
        platform_username,
        active
       FROM social_media_accounts
       WHERE active = true
       ORDER BY dj_id, platform, created_at DESC`
    );

    const accounts = result.rows;
    console.log(`📊 Found ${accounts.length} active social media accounts to update`);

    if (accounts.length === 0) {
      console.log('ℹ️  No active accounts found. Skipping update.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Group accounts by DJ for batch processing
    const accountsByDJ = {};
    accounts.forEach(account => {
      if (!accountsByDJ[account.dj_id]) {
        accountsByDJ[account.dj_id] = [];
      }
      accountsByDJ[account.dj_id].push(account);
    });

    // Process each DJ's accounts
    for (const [djId, djAccounts] of Object.entries(accountsByDJ)) {
      console.log(`\n🎧 Processing DJ ${djId} (${djAccounts.length} accounts)...`);

      for (const account of djAccounts) {
        try {
          console.log(`  📱 Fetching ${account.platform}: @${account.platform_username}`);

          // Fetch metrics based on platform
          let metrics;
          switch (account.platform) {
            case 'instagram':
              metrics = await scraperService.fetchInstagramMetrics(account.platform_username);
              break;
            case 'tiktok':
              metrics = await scraperService.fetchTikTokMetrics(account.platform_username);
              break;
            case 'youtube':
              metrics = await scraperService.fetchYouTubeMetrics(account.platform_username);
              break;
            case 'spotify':
              metrics = await scraperService.fetchSpotifyMetrics(account.platform_username);
              break;
            case 'soundcloud':
              metrics = await scraperService.fetchSoundCloudMetrics(account.platform_username);
              break;
            case 'facebook':
              metrics = await scraperService.fetchFacebookMetrics(account.platform_username);
              break;
            case 'twitter':
              metrics = await scraperService.fetchTwitterMetrics(account.platform_username);
              break;
            default:
              console.log(`  ⚠️  Unknown platform: ${account.platform}`);
              continue;
          }

          // Save snapshot if successful
          if (metrics.success) {
            const followers = metrics.followers || metrics.subscribers || 0;
            const engagement = metrics.engagement || 0;

            await db.query(
              `INSERT INTO social_media_snapshots
               (dj_id, platform, followers, engagement, data)
               VALUES ($1, $2, $3, $4, $5)`,
              [djId, account.platform, followers, engagement, JSON.stringify(metrics)]
            );

            console.log(`  ✅ ${account.platform}: ${followers} followers, ${engagement}% engagement`);
            successCount++;
          } else {
            console.log(`  ❌ ${account.platform}: ${metrics.error || 'Unknown error'}`);
            errorCount++;
          }

          // Add delay between requests to avoid rate limiting
          await delay(2000); // 2 seconds between each platform

        } catch (error) {
          console.error(`  ❌ Error updating ${account.platform}:`, error.message);
          errorCount++;
        }
      }
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Update completed: ${successCount} successful, ${errorCount} errors`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

  } catch (error) {
    console.error('❌ [Scheduled Job] Error updating social media metrics:', error);
  }
}

/**
 * Clean old snapshots (keep last 90 days)
 */
async function cleanOldSnapshots() {
  console.log('🧹 [Scheduled Job] Cleaning old snapshots (keeping last 90 days)...');

  try {
    const result = await db.query(
      `DELETE FROM social_media_snapshots
       WHERE created_at < NOW() - INTERVAL '90 days'
       RETURNING id`
    );

    console.log(`✅ Deleted ${result.rowCount} old snapshots`);
  } catch (error) {
    console.error('❌ Error cleaning old snapshots:', error);
  }
}

/**
 * Process email notification queue
 */
async function processEmailQueue() {
  console.log('📧 [Scheduled Job] Processing email queue...');

  try {
    const result = await emailService.processQueue();

    if (result.skipped) {
      console.log('⚠️  Email service not configured, skipping queue processing');
    } else {
      console.log(`✅ Email queue processed: ${result.processed} sent, ${result.failed} failed`);
    }
  } catch (error) {
    console.error('❌ Error processing email queue:', error);
  }
}

/**
 * Clean old notifications (keep last 90 days)
 */
async function cleanOldNotifications() {
  console.log('🧹 [Scheduled Job] Cleaning old notifications (keeping last 90 days)...');

  try {
    const deletedCount = await Notification.cleanupOld(90);
    console.log(`✅ Deleted ${deletedCount} old notifications`);
  } catch (error) {
    console.error('❌ Error cleaning old notifications:', error);
  }
}

/**
 * Clean expired notifications
 */
async function cleanExpiredNotifications() {
  console.log('🧹 [Scheduled Job] Cleaning expired notifications...');

  try {
    const deletedCount = await Notification.cleanupExpired();
    console.log(`✅ Deleted ${deletedCount} expired notifications`);
  } catch (error) {
    console.error('❌ Error cleaning expired notifications:', error);
  }
}

/**
 * Retry failed notifications
 */
async function retryFailedNotifications() {
  console.log('🔄 [Scheduled Job] Retrying failed notifications...');

  try {
    const retryCount = await Notification.retryFailed();
    console.log(`✅ Retried ${retryCount} failed notifications`);
  } catch (error) {
    console.error('❌ Error retrying failed notifications:', error);
  }
}

/**
 * Clean old emails from queue (keep last 30 days)
 */
async function cleanOldEmails() {
  console.log('🧹 [Scheduled Job] Cleaning old emails from queue (keeping last 30 days)...');

  try {
    const deletedCount = await emailService.cleanupOldEmails(30);
    console.log(`✅ Deleted ${deletedCount} old emails from queue`);
  } catch (error) {
    console.error('❌ Error cleaning old emails:', error);
  }
}

/**
 * Delay helper function
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Start all scheduled jobs
 */
export function startScheduledJobs() {
  console.log('');
  console.log('⏰ Starting scheduled jobs...');

  // Job 1: Update social media metrics daily at 3 AM
  const dailyUpdateTime = getMillisecondsUntilNextRun(3, 0); // 3:00 AM
  console.log(`📅 Daily metrics update scheduled for 3:00 AM`);
  console.log(`   Next run in: ${Math.round(dailyUpdateTime / 1000 / 60)} minutes`);

  // Run immediately on startup (optional - comment out if not desired)
  setTimeout(() => {
    updateAllSocialMediaMetrics();
  }, 10000); // 10 seconds after startup

  // Then run daily at 3 AM
  setTimeout(() => {
    updateAllSocialMediaMetrics();
    const interval = setInterval(updateAllSocialMediaMetrics, 24 * 60 * 60 * 1000); // Every 24 hours
    jobIntervals.push(interval);
  }, dailyUpdateTime);

  // Job 2: Clean old snapshots weekly (Sunday at 2 AM)
  const weeklyCleanTime = getMillisecondsUntilNextRun(2, 0, 0); // Sunday 2:00 AM
  console.log(`📅 Weekly cleanup scheduled for Sunday 2:00 AM`);
  console.log(`   Next run in: ${Math.round(weeklyCleanTime / 1000 / 60 / 60)} hours`);

  setTimeout(() => {
    cleanOldSnapshots();
    const interval = setInterval(cleanOldSnapshots, 7 * 24 * 60 * 60 * 1000); // Every 7 days
    jobIntervals.push(interval);
  }, weeklyCleanTime);

  // Job 3: Process email queue every 5 minutes
  console.log(`📅 Email queue processing scheduled every 5 minutes`);

  setTimeout(() => {
    processEmailQueue();
    const interval = setInterval(processEmailQueue, 5 * 60 * 1000); // Every 5 minutes
    jobIntervals.push(interval);
  }, 30000); // Start 30 seconds after startup

  // Job 4: Retry failed notifications every 15 minutes
  console.log(`📅 Failed notifications retry scheduled every 15 minutes`);

  setTimeout(() => {
    retryFailedNotifications();
    const interval = setInterval(retryFailedNotifications, 15 * 60 * 1000); // Every 15 minutes
    jobIntervals.push(interval);
  }, 60000); // Start 1 minute after startup

  // Job 5: Clean expired notifications daily at 1 AM
  const dailyExpiredCleanTime = getMillisecondsUntilNextRun(1, 0);
  console.log(`📅 Expired notifications cleanup scheduled for 1:00 AM`);
  console.log(`   Next run in: ${Math.round(dailyExpiredCleanTime / 1000 / 60)} minutes`);

  setTimeout(() => {
    cleanExpiredNotifications();
    const interval = setInterval(cleanExpiredNotifications, 24 * 60 * 60 * 1000); // Every 24 hours
    jobIntervals.push(interval);
  }, dailyExpiredCleanTime);

  // Job 6: Clean old notifications weekly (Sunday at 3 AM)
  const weeklyNotifCleanTime = getMillisecondsUntilNextRun(3, 0, 0); // Sunday 3:00 AM
  console.log(`📅 Old notifications cleanup scheduled for Sunday 3:00 AM`);
  console.log(`   Next run in: ${Math.round(weeklyNotifCleanTime / 1000 / 60 / 60)} hours`);

  setTimeout(() => {
    cleanOldNotifications();
    const interval = setInterval(cleanOldNotifications, 7 * 24 * 60 * 60 * 1000); // Every 7 days
    jobIntervals.push(interval);
  }, weeklyNotifCleanTime);

  // Job 7: Clean old emails weekly (Sunday at 4 AM)
  const weeklyEmailCleanTime = getMillisecondsUntilNextRun(4, 0, 0); // Sunday 4:00 AM
  console.log(`📅 Old emails cleanup scheduled for Sunday 4:00 AM`);
  console.log(`   Next run in: ${Math.round(weeklyEmailCleanTime / 1000 / 60 / 60)} hours`);

  setTimeout(() => {
    cleanOldEmails();
    const interval = setInterval(cleanOldEmails, 7 * 24 * 60 * 60 * 1000); // Every 7 days
    jobIntervals.push(interval);
  }, weeklyEmailCleanTime);

  console.log('✅ Scheduled jobs started successfully');
  console.log('');
}

/**
 * Stop all scheduled jobs
 */
export function stopScheduledJobs() {
  console.log('⏹️  Stopping scheduled jobs...');
  jobIntervals.forEach(interval => clearInterval(interval));
  jobIntervals = [];
  console.log('✅ All scheduled jobs stopped');
}

/**
 * Calculate milliseconds until next scheduled run
 */
function getMillisecondsUntilNextRun(targetHour, targetMinute, targetDay = null) {
  const now = new Date();
  const target = new Date();

  target.setHours(targetHour, targetMinute, 0, 0);

  // If target day specified (0 = Sunday, 6 = Saturday)
  if (targetDay !== null) {
    const currentDay = now.getDay();
    let daysUntilTarget = targetDay - currentDay;

    if (daysUntilTarget < 0) {
      daysUntilTarget += 7;
    } else if (daysUntilTarget === 0 && now > target) {
      daysUntilTarget = 7;
    }

    target.setDate(target.getDate() + daysUntilTarget);
  } else {
    // Daily job - if time has passed today, schedule for tomorrow
    if (now > target) {
      target.setDate(target.getDate() + 1);
    }
  }

  return target.getTime() - now.getTime();
}

/**
 * Manual trigger for testing
 */
export async function triggerManualUpdate() {
  console.log('🔧 [Manual Trigger] Starting metrics update...');
  await updateAllSocialMediaMetrics();
}

export default {
  startScheduledJobs,
  stopScheduledJobs,
  triggerManualUpdate,
  updateAllSocialMediaMetrics,
  cleanOldSnapshots,
  processEmailQueue,
  cleanOldNotifications,
  cleanExpiredNotifications,
  retryFailedNotifications,
  cleanOldEmails
};
