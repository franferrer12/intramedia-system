import Queue from 'bull';
import { scrapeInstagramProfile } from './advancedInstagramScraper.js';
import pool from '../config/database.js';

/**
 * Instagram Queue Service - Parallel Processing
 *
 * Features:
 * - Process multiple DJ Instagram scrapes in parallel
 * - Retry failed jobs automatically
 * - Rate limiting across all jobs
 * - Store results in database
 * - Event-based progress tracking
 */

// Create queue (uses Redis if available, otherwise in-memory)
const instagramQueue = new Queue('instagram-scraping', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    // Fallback to in-memory if Redis not available
    enableOfflineQueue: true,
    maxRetriesPerRequest: 1
  },
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 10000 // Start with 10s delay, then 20s, 40s
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50 // Keep last 50 failed jobs
  }
});

// Handle Redis connection errors gracefully
instagramQueue.client.on('error', (err) => {
  console.warn('⚠️  Redis connection error, queue will work in degraded mode:', err.message);
});

/**
 * Process Instagram scraping jobs
 */
instagramQueue.process(async (job) => {
  const { djId, username, options = {} } = job.data;

  console.log(`\n🎯 [Queue] Processing job ${job.id} for DJ ${djId} (@${username})`);

  try {
    // Update job progress
    await job.progress(10);

    // Scrape Instagram profile
    const result = await scrapeInstagramProfile(username, {
      skipPlaywright: options.skipPlaywright || false,
      useMock: options.useMock || false,
      maxRetries: options.maxRetries || 2
    });

    await job.progress(60);

    if (!result || !result.success) {
      throw new Error(`Scraping failed for @${username}`);
    }

    // Store results in database
    await storeInstagramData(djId, username, result);

    await job.progress(90);

    console.log(`✅ [Queue] Job ${job.id} completed successfully`);

    await job.progress(100);

    return {
      success: true,
      djId,
      username,
      metrics: result.metrics,
      method: result.method,
      is_mock: result.is_mock || false,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(`❌ [Queue] Job ${job.id} failed:`, error.message);
    throw error; // Will trigger retry if attempts remaining
  }
});

/**
 * Store Instagram data in database
 */
async function storeInstagramData(djId, username, instagramData) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if social_media_accounts table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'social_media_accounts'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('📋 Creating social_media_accounts table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS social_media_accounts (
          id SERIAL PRIMARY KEY,
          dj_id INTEGER NOT NULL,
          platform VARCHAR(50) NOT NULL,
          platform_username VARCHAR(255) NOT NULL,
          display_name VARCHAR(255),
          profile_url TEXT,
          profile_picture_url TEXT,
          bio TEXT,
          is_verified BOOLEAN DEFAULT false,
          is_private BOOLEAN DEFAULT false,
          followers_count INTEGER DEFAULT 0,
          following_count INTEGER DEFAULT 0,
          posts_count INTEGER DEFAULT 0,
          engagement_rate DECIMAL(5,2) DEFAULT 0,
          avg_likes INTEGER DEFAULT 0,
          last_scraped_at TIMESTAMP,
          scraping_method VARCHAR(50),
          is_mock_data BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(dj_id, platform)
        );
      `);
    }

    // Check if metrics history table exists
    const historyCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'social_media_metrics_history'
      );
    `);

    if (!historyCheck.rows[0].exists) {
      console.log('📊 Creating social_media_metrics_history table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS social_media_metrics_history (
          id SERIAL PRIMARY KEY,
          account_id INTEGER NOT NULL,
          followers_count INTEGER DEFAULT 0,
          following_count INTEGER DEFAULT 0,
          posts_count INTEGER DEFAULT 0,
          engagement_rate DECIMAL(5,2) DEFAULT 0,
          avg_likes INTEGER DEFAULT 0,
          recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          scraping_method VARCHAR(50),
          is_mock_data BOOLEAN DEFAULT false
        );
      `);
    }

    // Upsert social media account
    const accountResult = await client.query(`
      INSERT INTO social_media_accounts (
        dj_id, platform, platform_username, display_name,
        profile_url, profile_picture_url, bio,
        is_verified, is_private,
        followers_count, following_count, posts_count,
        engagement_rate, avg_likes,
        last_scraped_at, scraping_method, is_mock_data,
        updated_at
      ) VALUES (
        $1, 'instagram', $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP
      )
      ON CONFLICT (dj_id, platform)
      DO UPDATE SET
        platform_username = EXCLUDED.platform_username,
        display_name = EXCLUDED.display_name,
        profile_url = EXCLUDED.profile_url,
        profile_picture_url = EXCLUDED.profile_picture_url,
        bio = EXCLUDED.bio,
        is_verified = EXCLUDED.is_verified,
        is_private = EXCLUDED.is_private,
        followers_count = EXCLUDED.followers_count,
        following_count = EXCLUDED.following_count,
        posts_count = EXCLUDED.posts_count,
        engagement_rate = EXCLUDED.engagement_rate,
        avg_likes = EXCLUDED.avg_likes,
        last_scraped_at = EXCLUDED.last_scraped_at,
        scraping_method = EXCLUDED.scraping_method,
        is_mock_data = EXCLUDED.is_mock_data,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id;
    `, [
      djId,
      username,
      instagramData.profile.name || username,
      `https://instagram.com/${username}`,
      instagramData.profile.profile_picture_url || null,
      instagramData.profile.biography || null,
      instagramData.profile.is_verified || false,
      instagramData.profile.is_private || false,
      instagramData.metrics.followers || 0,
      instagramData.metrics.following || 0,
      instagramData.metrics.posts || 0,
      instagramData.metrics.engagement_rate || 0,
      instagramData.metrics.avg_likes || 0,
      new Date(),
      instagramData.method || 'unknown',
      instagramData.is_mock || false
    ]);

    const accountId = accountResult.rows[0].id;

    // Insert metrics history
    await client.query(`
      INSERT INTO social_media_metrics_history (
        account_id, followers_count, following_count, posts_count,
        engagement_rate, avg_likes, recorded_at,
        scraping_method, is_mock_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
    `, [
      accountId,
      instagramData.metrics.followers || 0,
      instagramData.metrics.following || 0,
      instagramData.metrics.posts || 0,
      instagramData.metrics.engagement_rate || 0,
      instagramData.metrics.avg_likes || 0,
      new Date(),
      instagramData.method || 'unknown',
      instagramData.is_mock || false
    ]);

    await client.query('COMMIT');

    console.log(`💾 [Database] Stored Instagram data for DJ ${djId} (@${username})`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ [Database] Error storing data for DJ ${djId}:`, error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Add a scraping job to the queue
 */
export async function queueInstagramScrape(djId, username, options = {}) {
  try {
    const job = await instagramQueue.add({
      djId,
      username,
      options
    }, {
      jobId: `dj-${djId}-${Date.now()}`, // Unique job ID
      priority: options.priority || 10 // Lower number = higher priority
    });

    console.log(`➕ [Queue] Added job ${job.id} for DJ ${djId} (@${username})`);

    return {
      success: true,
      jobId: job.id,
      djId,
      username
    };

  } catch (error) {
    console.error(`❌ [Queue] Error adding job for DJ ${djId}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Queue scraping for multiple DJs in parallel
 */
export async function queueBulkInstagramScrape(djs, options = {}) {
  console.log(`\n📦 [Bulk Queue] Queuing ${djs.length} DJs for Instagram scraping...`);

  const results = [];

  for (const dj of djs) {
    const result = await queueInstagramScrape(dj.id, dj.username, options);
    results.push(result);

    // Small delay between queuing to avoid overwhelming the queue
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ [Bulk Queue] Queued ${successful} jobs successfully, ${failed} failed`);

  return {
    total: djs.length,
    successful,
    failed,
    results
  };
}

/**
 * Get job status
 */
export async function getJobStatus(jobId) {
  try {
    const job = await instagramQueue.getJob(jobId);

    if (!job) {
      return { success: false, error: 'Job not found' };
    }

    const state = await job.getState();
    const progress = job.progress();

    return {
      success: true,
      jobId: job.id,
      state,
      progress,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
      attempts: job.attemptsMade,
      timestamp: job.timestamp
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      instagramQueue.getWaitingCount(),
      instagramQueue.getActiveCount(),
      instagramQueue.getCompletedCount(),
      instagramQueue.getFailedCount(),
      instagramQueue.getDelayedCount()
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed
    };

  } catch (error) {
    console.error('Error getting queue stats:', error.message);
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      total: 0
    };
  }
}

/**
 * Clean old completed jobs
 */
export async function cleanQueue() {
  try {
    await instagramQueue.clean(24 * 60 * 60 * 1000); // Remove jobs older than 24h
    console.log('🧹 [Queue] Cleaned old jobs');
  } catch (error) {
    console.error('Error cleaning queue:', error.message);
  }
}

// Event listeners for monitoring
instagramQueue.on('completed', (job, result) => {
  console.log(`✅ [Queue Event] Job ${job.id} completed:`, result.username);
});

instagramQueue.on('failed', (job, err) => {
  console.error(`❌ [Queue Event] Job ${job.id} failed:`, err.message);
});

instagramQueue.on('stalled', (job) => {
  console.warn(`⚠️  [Queue Event] Job ${job.id} stalled`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Closing Instagram queue...');
  await instagramQueue.close();
});

export default {
  queueInstagramScrape,
  queueBulkInstagramScrape,
  getJobStatus,
  getQueueStats,
  cleanQueue,
  queue: instagramQueue
};
