import db from '../config/database.js';
import scraperService from './socialMediaScraperService.js';

/**
 * Scheduled Jobs Service
 * Handles automatic updates of social media metrics
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
  cleanOldSnapshots
};
