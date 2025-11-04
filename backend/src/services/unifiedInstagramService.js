import pool from '../config/database.js';
import { getCompleteInstagramAnalytics } from './instagramGraphService.js';
import scraperService from './socialMediaScraperService.js';

/**
 * Unified Instagram Service
 * Intelligent routing between OAuth and Scraping methods
 *
 * Priority:
 * 1. OAuth (if connected) - Full data with real photos
 * 2. Scraping (fallback) - Basic metrics + placeholders
 */

/**
 * Get Instagram data for a DJ using the best available method
 * @param {number} djId - DJ ID
 * @param {Object} options - Options { forceRefresh: boolean }
 * @returns {Object} Instagram analytics data
 */
export async function getInstagramData(djId, options = {}) {
  try {
    console.log(`📊 [Unified Instagram] Fetching data for DJ ${djId}...`);

    // Step 1: Check if OAuth connection exists
    const oauthStatus = await checkOAuthConnection(djId);

    if (oauthStatus.hasOAuth && oauthStatus.isActive && !oauthStatus.isExpired) {
      // Use OAuth - Full access with photos
      console.log(`✅ [Unified Instagram] Using OAuth for DJ ${djId}`);
      return await getOAuthData(djId, options);
    }

    // Step 2: Fall back to scraping
    console.log(`📱 [Unified Instagram] Using Scraping for DJ ${djId}`);
    return await getScrapingData(djId, options);

  } catch (error) {
    console.error(`❌ [Unified Instagram] Error for DJ ${djId}:`, error.message);
    throw error;
  }
}

/**
 * Check OAuth connection status
 */
async function checkOAuthConnection(djId) {
  try {
    const result = await pool.query(
      `SELECT
        sc.connection_type,
        sc.is_active,
        sc.username,
        ot.expires_at,
        ot.id as token_id
      FROM social_connections sc
      LEFT JOIN oauth_tokens ot ON
        sc.dj_id = ot.dj_id AND
        sc.platform = ot.platform AND
        ot.is_active = true
      WHERE sc.dj_id = $1 AND sc.platform = 'instagram'`,
      [djId]
    );

    if (result.rows.length === 0) {
      return {
        hasOAuth: false,
        isActive: false,
        isExpired: null,
        username: null
      };
    }

    const connection = result.rows[0];
    const isExpired = connection.expires_at
      ? new Date(connection.expires_at) < new Date()
      : false;

    return {
      hasOAuth: connection.connection_type === 'oauth' && connection.token_id !== null,
      isActive: connection.is_active,
      isExpired,
      username: connection.username
    };
  } catch (error) {
    console.error('Error checking OAuth connection:', error);
    return {
      hasOAuth: false,
      isActive: false,
      isExpired: null,
      username: null
    };
  }
}

/**
 * Get Instagram data via OAuth
 */
async function getOAuthData(djId, options) {
  try {
    const analytics = await getCompleteInstagramAnalytics(djId);

    // Save snapshot to social_media_snapshots for compatibility
    await saveSnapshot(djId, 'instagram', {
      success: true,
      connection_method: 'oauth',
      followers: analytics.metrics.followers,
      engagement: analytics.metrics.total_engagement,
      engagement_rate: analytics.metrics.engagement_rate,
      posts_count: analytics.metrics.posts_count,
      impressions: analytics.metrics.impressions,
      reach: analytics.metrics.reach,
      profile_views: analytics.metrics.profile_views,
      username: analytics.profile.username,
      account_type: analytics.profile.account_type,
      recent_posts: analytics.recent_posts,
      top_post: analytics.top_post
    });

    return {
      success: true,
      connection_method: 'oauth',
      has_photos: true,
      ...analytics
    };
  } catch (error) {
    console.error('OAuth fetch failed, falling back to scraping:', error.message);

    // If OAuth fails, fall back to scraping
    return await getScrapingData(djId, options);
  }
}

/**
 * Get Instagram data via Scraping
 */
async function getScrapingData(djId, options) {
  try {
    // Get username from social_connections or social_media_accounts
    const username = await getInstagramUsername(djId);

    if (!username) {
      throw new Error('No Instagram username found for this DJ');
    }

    console.log(`🔍 [Scraping] Fetching data for @${username}...`);

    // Use existing scraper service
    const metrics = await scraperService.fetchInstagramMetrics(
      username,
      null,
      djId
    );

    if (!metrics.success) {
      throw new Error(metrics.error || 'Failed to fetch Instagram data');
    }

    // Save snapshot
    await saveSnapshot(djId, 'instagram', {
      ...metrics,
      connection_method: 'scraping'
    });

    // Ensure social_connections exists
    await ensureSocialConnection(djId, username);

    return {
      success: true,
      connection_method: 'scraping',
      has_photos: false,
      profile: {
        username: metrics.username || username,
        account_type: 'PERSONAL'
      },
      metrics: {
        followers: metrics.followers || 0,
        posts_count: metrics.recent_posts?.length || 0,
        total_engagement: calculateTotalEngagement(metrics.recent_posts),
        engagement_rate: metrics.engagement || 0,
        impressions: null,
        reach: null,
        profile_views: null
      },
      recent_posts: metrics.recent_posts || [],
      top_post: metrics.top_post || null,
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Scraping fetch failed:', error.message);
    throw error;
  }
}

/**
 * Get Instagram username for a DJ
 */
async function getInstagramUsername(djId) {
  // Try social_connections first (new system)
  let result = await pool.query(
    `SELECT username
     FROM social_connections
     WHERE dj_id = $1 AND platform = 'instagram' AND is_active = true`,
    [djId]
  );

  if (result.rows.length > 0 && result.rows[0].username) {
    return result.rows[0].username;
  }

  // Fall back to social_media_accounts (old system)
  result = await pool.query(
    `SELECT platform_username
     FROM social_media_accounts
     WHERE dj_id = $1 AND platform = 'instagram' AND active = true`,
    [djId]
  );

  if (result.rows.length > 0 && result.rows[0].platform_username) {
    return result.rows[0].platform_username;
  }

  return null;
}

/**
 * Ensure social_connections record exists
 */
async function ensureSocialConnection(djId, username) {
  try {
    await pool.query(
      `INSERT INTO social_connections (
        dj_id,
        platform,
        connection_type,
        is_active,
        username,
        last_sync,
        last_sync_status
      ) VALUES ($1, 'instagram', 'scraping', true, $2, CURRENT_TIMESTAMP, 'success')
      ON CONFLICT (dj_id, platform)
      DO UPDATE SET
        username = EXCLUDED.username,
        last_sync = CURRENT_TIMESTAMP,
        last_sync_status = 'success',
        sync_error_message = NULL
      WHERE social_connections.connection_type = 'scraping'`,
      [djId, username]
    );
  } catch (error) {
    console.error('Error ensuring social connection:', error);
  }
}

/**
 * Save snapshot to database (for compatibility with existing system)
 */
async function saveSnapshot(djId, platform, metricsData) {
  try {
    const followers = metricsData.followers || metricsData.subscribers || 0;
    const engagement = metricsData.engagement || metricsData.engagement_rate || 0;

    await pool.query(
      `INSERT INTO social_media_snapshots
       (dj_id, platform, followers, engagement, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [djId, platform, followers, engagement, JSON.stringify(metricsData)]
    );

    console.log(`💾 [Snapshot] Saved for DJ ${djId} on ${platform}`);
  } catch (error) {
    console.error(`Error saving snapshot for ${platform}:`, error);
  }
}

/**
 * Calculate total engagement from posts
 */
function calculateTotalEngagement(posts) {
  if (!Array.isArray(posts)) return 0;

  return posts.reduce((total, post) => {
    const likes = post.likes || 0;
    const comments = post.comments || 0;
    return total + likes + comments;
  }, 0);
}

/**
 * Link Instagram account by username (scraping mode)
 * @param {number} djId - DJ ID
 * @param {string} username - Instagram username
 * @returns {Object} Initial metrics
 */
export async function linkInstagramByUsername(djId, username) {
  try {
    console.log(`🔗 [Unified Instagram] Linking @${username} for DJ ${djId}...`);

    // Create/update social_connections
    await pool.query(
      `INSERT INTO social_connections (
        dj_id,
        platform,
        connection_type,
        is_active,
        username,
        last_sync,
        last_sync_status
      ) VALUES ($1, 'instagram', 'scraping', true, $2, CURRENT_TIMESTAMP, 'pending')
      ON CONFLICT (dj_id, platform)
      DO UPDATE SET
        connection_type = CASE
          WHEN social_connections.connection_type = 'oauth' THEN 'oauth'
          ELSE 'scraping'
        END,
        username = EXCLUDED.username,
        last_sync = CURRENT_TIMESTAMP
      WHERE social_connections.connection_type != 'oauth'`,
      [djId, username]
    );

    // Also update old table for compatibility
    await pool.query(
      `INSERT INTO social_media_accounts
       (dj_id, platform, platform_username, active)
       VALUES ($1, 'instagram', $2, true)
       ON CONFLICT (dj_id, platform)
       DO UPDATE SET
         platform_username = EXCLUDED.platform_username,
         active = true,
         updated_at = CURRENT_TIMESTAMP`,
      [djId, username]
    );

    // Fetch initial metrics
    const metrics = await getScrapingData(djId, { forceRefresh: true });

    return {
      success: true,
      message: `Instagram @${username} linked successfully (scraping mode)`,
      data: metrics
    };
  } catch (error) {
    console.error('Error linking Instagram by username:', error);

    // Update connection with error
    await pool.query(
      `UPDATE social_connections
       SET last_sync_status = 'error',
           sync_error_message = $2
       WHERE dj_id = $1 AND platform = 'instagram'`,
      [djId, error.message]
    );

    throw error;
  }
}

/**
 * Unlink Instagram account
 * @param {number} djId - DJ ID
 * @param {boolean} keepOAuth - Keep OAuth connection if exists
 */
export async function unlinkInstagram(djId, keepOAuth = false) {
  try {
    if (!keepOAuth) {
      // Deactivate OAuth tokens
      await pool.query(
        'UPDATE oauth_tokens SET is_active = false WHERE dj_id = $1 AND platform = $2',
        [djId, 'instagram']
      );
    }

    // Deactivate social_connections
    await pool.query(
      `UPDATE social_connections
       SET is_active = false
       WHERE dj_id = $1 AND platform = $2`,
      [djId, 'instagram']
    );

    // Deactivate old table for compatibility
    await pool.query(
      `UPDATE social_media_accounts
       SET active = false, updated_at = CURRENT_TIMESTAMP
       WHERE dj_id = $1 AND platform = $2`,
      [djId, 'instagram']
    );

    return {
      success: true,
      message: 'Instagram account unlinked successfully'
    };
  } catch (error) {
    console.error('Error unlinking Instagram:', error);
    throw error;
  }
}

/**
 * Get connection status and last sync info
 * @param {number} djId - DJ ID
 * @returns {Object} Connection status
 */
export async function getConnectionStatus(djId) {
  const oauthStatus = await checkOAuthConnection(djId);
  const username = await getInstagramUsername(djId);

  // Get last sync info
  const syncResult = await pool.query(
    `SELECT last_sync, last_sync_status, sync_error_message
     FROM social_connections
     WHERE dj_id = $1 AND platform = 'instagram'`,
    [djId]
  );

  const syncInfo = syncResult.rows[0] || {};

  return {
    connected: oauthStatus.hasOAuth || username !== null,
    connection_type: oauthStatus.hasOAuth ? 'oauth' : username ? 'scraping' : null,
    has_photos: oauthStatus.hasOAuth,
    username: oauthStatus.username || username,
    is_active: oauthStatus.isActive,
    token_expired: oauthStatus.isExpired,
    last_sync: syncInfo.last_sync,
    last_sync_status: syncInfo.last_sync_status,
    sync_error: syncInfo.sync_error_message,
    can_upgrade_to_oauth: username !== null && !oauthStatus.hasOAuth
  };
}

export default {
  getInstagramData,
  linkInstagramByUsername,
  unlinkInstagram,
  getConnectionStatus
};
