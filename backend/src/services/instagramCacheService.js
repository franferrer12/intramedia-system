import pool from '../config/database.js';

/**
 * Instagram Cache Service
 *
 * Features:
 * - Cache Instagram data in database to reduce API calls
 * - Configurable TTL (Time To Live)
 * - Automatic cache invalidation
 * - Cache hit/miss tracking
 */

const DEFAULT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Get cached Instagram data for a DJ
 */
export async function getCachedInstagramData(djId, username) {
  try {
    const result = await pool.query(`
      SELECT
        id,
        platform_username,
        display_name,
        profile_url,
        profile_picture_url,
        bio,
        is_verified,
        is_private,
        followers_count,
        following_count,
        posts_count,
        engagement_rate,
        avg_likes,
        last_scraped_at,
        scraping_method,
        is_mock_data,
        updated_at
      FROM social_media_accounts
      WHERE dj_id = $1 AND platform = 'instagram'
      AND last_scraped_at IS NOT NULL
      ORDER BY last_scraped_at DESC
      LIMIT 1;
    `, [djId]);

    if (result.rows.length === 0) {
      console.log(`❌ [Cache MISS] No cached data for DJ ${djId} (@${username})`);
      return null;
    }

    const cachedData = result.rows[0];
    const cacheAge = Date.now() - new Date(cachedData.last_scraped_at).getTime();
    const isExpired = cacheAge > DEFAULT_CACHE_TTL;

    if (isExpired) {
      console.log(`⏰ [Cache EXPIRED] Data for DJ ${djId} is ${Math.round(cacheAge / 1000 / 60 / 60)}h old`);
      return null;
    }

    console.log(`✅ [Cache HIT] Fresh data for DJ ${djId} (age: ${Math.round(cacheAge / 1000 / 60)}min)`);

    return {
      success: true,
      cached: true,
      cache_age_ms: cacheAge,
      cache_age_hours: (cacheAge / 1000 / 60 / 60).toFixed(1),
      method: cachedData.scraping_method,
      is_mock: cachedData.is_mock_data,
      username: cachedData.platform_username,
      profile: {
        name: cachedData.display_name,
        username: cachedData.platform_username,
        biography: cachedData.bio,
        profile_picture_url: cachedData.profile_picture_url,
        is_verified: cachedData.is_verified,
        is_private: cachedData.is_private
      },
      metrics: {
        followers: cachedData.followers_count,
        following: cachedData.following_count,
        posts: cachedData.posts_count,
        engagement_rate: parseFloat(cachedData.engagement_rate),
        avg_likes: cachedData.avg_likes
      },
      last_update: cachedData.last_scraped_at,
      recent_posts: [], // Would need separate posts table for this
      top_post: null,
      growth: await getGrowthData(cachedData.id)
    };

  } catch (error) {
    console.error(`❌ [Cache Error] Error getting cache for DJ ${djId}:`, error.message);
    return null;
  }
}

/**
 * Get growth data from metrics history
 */
async function getGrowthData(accountId) {
  try {
    const result = await pool.query(`
      SELECT
        followers_count,
        posts_count,
        engagement_rate,
        recorded_at
      FROM social_media_metrics_history
      WHERE account_id = $1
      ORDER BY recorded_at DESC
      LIMIT 30;
    `, [accountId]);

    if (result.rows.length < 2) {
      return null;
    }

    const latest = result.rows[0];
    const previous = result.rows[result.rows.length - 1];

    const followerChange = latest.followers_count - previous.followers_count;
    const postChange = latest.posts_count - previous.posts_count;

    return {
      followers: {
        current: latest.followers_count,
        change: followerChange,
        percentage: previous.followers_count > 0
          ? ((followerChange / previous.followers_count) * 100).toFixed(2)
          : 0
      },
      posts: {
        current: latest.posts_count,
        change: postChange
      },
      engagement: {
        current: parseFloat(latest.engagement_rate),
        previous: parseFloat(previous.engagement_rate),
        change: (parseFloat(latest.engagement_rate) - parseFloat(previous.engagement_rate)).toFixed(2)
      },
      period_days: Math.round(
        (new Date(latest.recorded_at) - new Date(previous.recorded_at)) / 1000 / 60 / 60 / 24
      ),
      history: result.rows.map(row => ({
        followers: row.followers_count,
        posts: row.posts_count,
        engagement: parseFloat(row.engagement_rate),
        date: row.recorded_at
      }))
    };

  } catch (error) {
    console.error('Error getting growth data:', error.message);
    return null;
  }
}

/**
 * Check if cache is fresh (not expired)
 */
export async function isCacheFresh(djId, ttlMs = DEFAULT_CACHE_TTL) {
  try {
    const result = await pool.query(`
      SELECT last_scraped_at
      FROM social_media_accounts
      WHERE dj_id = $1 AND platform = 'instagram'
      AND last_scraped_at IS NOT NULL;
    `, [djId]);

    if (result.rows.length === 0) {
      return false;
    }

    const cacheAge = Date.now() - new Date(result.rows[0].last_scraped_at).getTime();
    return cacheAge < ttlMs;

  } catch (error) {
    console.error('Error checking cache freshness:', error.message);
    return false;
  }
}

/**
 * Invalidate cache for a DJ (force refresh)
 */
export async function invalidateCache(djId) {
  try {
    await pool.query(`
      UPDATE social_media_accounts
      SET last_scraped_at = NULL
      WHERE dj_id = $1 AND platform = 'instagram';
    `, [djId]);

    console.log(`🗑️  [Cache] Invalidated cache for DJ ${djId}`);
    return true;

  } catch (error) {
    console.error(`Error invalidating cache for DJ ${djId}:`, error.message);
    return false;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_accounts,
        COUNT(CASE WHEN last_scraped_at IS NOT NULL THEN 1 END) as cached_accounts,
        COUNT(CASE WHEN last_scraped_at > NOW() - INTERVAL '24 hours' THEN 1 END) as fresh_accounts,
        COUNT(CASE WHEN is_mock_data = true THEN 1 END) as mock_accounts,
        AVG(EXTRACT(EPOCH FROM (NOW() - last_scraped_at))) as avg_cache_age_seconds
      FROM social_media_accounts
      WHERE platform = 'instagram';
    `);

    const stats = result.rows[0];

    return {
      total_accounts: parseInt(stats.total_accounts) || 0,
      cached_accounts: parseInt(stats.cached_accounts) || 0,
      fresh_accounts: parseInt(stats.fresh_accounts) || 0,
      mock_accounts: parseInt(stats.mock_accounts) || 0,
      avg_cache_age_hours: stats.avg_cache_age_seconds
        ? (parseFloat(stats.avg_cache_age_seconds) / 3600).toFixed(1)
        : 0,
      cache_hit_rate: stats.total_accounts > 0
        ? ((parseInt(stats.fresh_accounts) / parseInt(stats.total_accounts)) * 100).toFixed(1)
        : 0
    };

  } catch (error) {
    console.error('Error getting cache stats:', error.message);
    return {
      total_accounts: 0,
      cached_accounts: 0,
      fresh_accounts: 0,
      mock_accounts: 0,
      avg_cache_age_hours: 0,
      cache_hit_rate: 0
    };
  }
}

/**
 * Clean up old cache entries
 */
export async function cleanOldCache(daysOld = 30) {
  try {
    const result = await pool.query(`
      DELETE FROM social_media_accounts
      WHERE platform = 'instagram'
      AND last_scraped_at < NOW() - INTERVAL '${daysOld} days'
      AND is_mock_data = true
      RETURNING id;
    `);

    console.log(`🧹 [Cache] Cleaned ${result.rowCount} old mock entries`);
    return result.rowCount;

  } catch (error) {
    console.error('Error cleaning old cache:', error.message);
    return 0;
  }
}

/**
 * Get metrics history for a DJ
 */
export async function getMetricsHistory(djId, days = 30) {
  try {
    const accountResult = await pool.query(`
      SELECT id FROM social_media_accounts
      WHERE dj_id = $1 AND platform = 'instagram';
    `, [djId]);

    if (accountResult.rows.length === 0) {
      return [];
    }

    const accountId = accountResult.rows[0].id;

    const historyResult = await pool.query(`
      SELECT
        followers_count,
        following_count,
        posts_count,
        engagement_rate,
        avg_likes,
        recorded_at,
        scraping_method,
        is_mock_data
      FROM social_media_metrics_history
      WHERE account_id = $1
      AND recorded_at > NOW() - INTERVAL '${days} days'
      ORDER BY recorded_at ASC;
    `, [accountId]);

    return historyResult.rows.map(row => ({
      followers: row.followers_count,
      following: row.following_count,
      posts: row.posts_count,
      engagement_rate: parseFloat(row.engagement_rate),
      avg_likes: row.avg_likes,
      date: row.recorded_at,
      method: row.scraping_method,
      is_mock: row.is_mock_data
    }));

  } catch (error) {
    console.error(`Error getting metrics history for DJ ${djId}:`, error.message);
    return [];
  }
}

export default {
  getCachedInstagramData,
  isCacheFresh,
  invalidateCache,
  getCacheStats,
  cleanOldCache,
  getMetricsHistory
};
