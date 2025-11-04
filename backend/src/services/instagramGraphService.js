import axios from 'axios';
import pool from '../config/database.js';
import { encrypt, decrypt } from './encryptionService.js';

const GRAPH_API_BASE = process.env.INSTAGRAM_GRAPH_API_BASE_URL || 'https://graph.instagram.com';
const API_VERSION = process.env.INSTAGRAM_GRAPH_API_VERSION || 'v21.0';

/**
 * Instagram Graph API Service
 * Handles all interactions with Instagram's official Graph API
 */

/**
 * Get Instagram user profile
 * @param {string} accessToken - Instagram access token
 * @returns {Object} User profile data
 */
export async function getInstagramProfile(accessToken) {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${API_VERSION}/me`, {
      params: {
        fields: 'id,username,account_type,media_count',
        access_token: accessToken
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching Instagram profile:', error.response?.data || error.message);
    throw new Error('Failed to fetch Instagram profile');
  }
}

/**
 * Get Instagram user insights (requires Business/Creator account)
 * @param {string} userId - Instagram user ID
 * @param {string} accessToken - Instagram access token
 * @returns {Object} User insights
 */
export async function getInstagramInsights(userId, accessToken) {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${API_VERSION}/${userId}/insights`, {
      params: {
        metric: 'follower_count,impressions,reach,profile_views',
        period: 'day',
        access_token: accessToken
      }
    });

    // Parse insights into readable format
    const insights = {};
    response.data.data.forEach(metric => {
      insights[metric.name] = metric.values[metric.values.length - 1].value;
    });

    return insights;
  } catch (error) {
    console.error('Error fetching Instagram insights:', error.response?.data || error.message);
    // Return empty insights if not available (e.g., personal account)
    return {
      follower_count: null,
      impressions: null,
      reach: null,
      profile_views: null
    };
  }
}

/**
 * Get Instagram media (posts)
 * @param {string} userId - Instagram user ID
 * @param {string} accessToken - Instagram access token
 * @param {number} limit - Number of posts to fetch
 * @returns {Array} Media posts
 */
export async function getInstagramMedia(userId, accessToken, limit = 25) {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${API_VERSION}/${userId}/media`, {
      params: {
        fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
        limit,
        access_token: accessToken
      }
    });

    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching Instagram media:', error.response?.data || error.message);
    throw new Error('Failed to fetch Instagram media');
  }
}

/**
 * Get complete Instagram analytics for a DJ
 * Combines profile, insights, and media data
 * @param {number} djId - DJ ID
 * @returns {Object} Complete analytics data
 */
export async function getCompleteInstagramAnalytics(djId) {
  try {
    // Get OAuth token from database
    const tokenResult = await pool.query(
      `SELECT
        access_token,
        platform_user_id,
        platform_username,
        expires_at,
        is_active
      FROM oauth_tokens
      WHERE dj_id = $1 AND platform = 'instagram' AND is_active = true`,
      [djId]
    );

    if (tokenResult.rows.length === 0) {
      throw new Error('No active Instagram connection found for this DJ');
    }

    const tokenData = tokenResult.rows[0];

    // Check if token is expired
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      throw new Error('Instagram token expired - please reconnect');
    }

    // Decrypt access token
    const accessToken = decrypt(tokenData.access_token);

    // Fetch data in parallel
    const [profile, insights, media] = await Promise.all([
      getInstagramProfile(accessToken),
      getInstagramInsights(tokenData.platform_user_id, accessToken),
      getInstagramMedia(tokenData.platform_user_id, accessToken, 25)
    ]);

    // Process media to calculate engagement
    const processedPosts = media.map(post => ({
      id: post.id,
      caption: post.caption || '',
      media_type: post.media_type,
      media_url: post.media_url,
      thumbnail_url: post.thumbnail_url || post.media_url,
      permalink: post.permalink,
      timestamp: post.timestamp,
      likes: post.like_count || 0,
      comments: post.comments_count || 0,
      engagement: (post.like_count || 0) + (post.comments_count || 0)
    }));

    // Calculate total engagement
    const totalEngagement = processedPosts.reduce((sum, post) => sum + post.engagement, 0);

    // Find top post
    const topPost = processedPosts.reduce((top, post) =>
      !top || post.engagement > top.engagement ? post : top
    , null);

    // Calculate engagement rate (if we have follower count)
    const followerCount = insights.follower_count || profile.media_count || 1000;
    const avgEngagementPerPost = processedPosts.length > 0
      ? totalEngagement / processedPosts.length
      : 0;
    const engagementRate = followerCount > 0
      ? (avgEngagementPerPost / followerCount * 100).toFixed(2)
      : 0;

    // Update social_connections table
    await pool.query(
      `UPDATE social_connections
       SET last_sync = CURRENT_TIMESTAMP,
           last_sync_status = 'success',
           sync_error_message = NULL
       WHERE dj_id = $1 AND platform = 'instagram'`,
      [djId]
    );

    return {
      connection_type: 'oauth',
      profile: {
        username: profile.username || tokenData.platform_username,
        account_type: profile.account_type,
        media_count: profile.media_count
      },
      metrics: {
        followers: followerCount,
        impressions: insights.impressions,
        reach: insights.reach,
        profile_views: insights.profile_views,
        posts_count: processedPosts.length,
        total_engagement: totalEngagement,
        engagement_rate: parseFloat(engagementRate)
      },
      recent_posts: processedPosts,
      top_post: topPost,
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting Instagram analytics:', error);

    // Update social_connections with error
    await pool.query(
      `UPDATE social_connections
       SET last_sync = CURRENT_TIMESTAMP,
           last_sync_status = 'error',
           sync_error_message = $2
       WHERE dj_id = $1 AND platform = 'instagram'`,
      [djId, error.message]
    );

    throw error;
  }
}

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code from OAuth callback
 * @returns {Object} Token data
 */
export async function exchangeCodeForToken(code) {
  try {
    const response = await axios.post(`${GRAPH_API_BASE}/oauth/access_token`, null, {
      params: {
        client_id: process.env.INSTAGRAM_APP_ID,
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
        code
      }
    });

    return {
      access_token: response.data.access_token,
      user_id: response.data.user_id
    };
  } catch (error) {
    console.error('Error exchanging code for token:', error.response?.data || error.message);
    throw new Error('Failed to exchange authorization code');
  }
}

/**
 * Exchange short-lived token for long-lived token
 * @param {string} shortLivedToken - Short-lived access token
 * @returns {Object} Long-lived token data
 */
export async function getLongLivedToken(shortLivedToken) {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/access_token`, {
      params: {
        grant_type: 'ig_exchange_token',
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        access_token: shortLivedToken
      }
    });

    return {
      access_token: response.data.access_token,
      token_type: response.data.token_type || 'bearer',
      expires_in: response.data.expires_in // Usually 60 days
    };
  } catch (error) {
    console.error('Error getting long-lived token:', error.response?.data || error.message);
    throw new Error('Failed to get long-lived token');
  }
}

/**
 * Refresh long-lived token
 * @param {string} longLivedToken - Current long-lived token
 * @returns {Object} Refreshed token data
 */
export async function refreshLongLivedToken(longLivedToken) {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/refresh_access_token`, {
      params: {
        grant_type: 'ig_refresh_token',
        access_token: longLivedToken
      }
    });

    return {
      access_token: response.data.access_token,
      token_type: response.data.token_type || 'bearer',
      expires_in: response.data.expires_in
    };
  } catch (error) {
    console.error('Error refreshing token:', error.response?.data || error.message);
    throw new Error('Failed to refresh token');
  }
}

/**
 * Save OAuth token to database
 * @param {number} djId - DJ ID
 * @param {Object} tokenData - Token data to save
 */
export async function saveOAuthToken(djId, tokenData) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Encrypt tokens
    const encryptedAccessToken = encrypt(tokenData.access_token);
    const encryptedRefreshToken = tokenData.refresh_token
      ? encrypt(tokenData.refresh_token)
      : null;

    // Calculate expiration date
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    // Deactivate old tokens
    await client.query(
      'UPDATE oauth_tokens SET is_active = false WHERE dj_id = $1 AND platform = $2',
      [djId, 'instagram']
    );

    // Insert new token
    await client.query(
      `INSERT INTO oauth_tokens (
        dj_id,
        platform,
        access_token,
        refresh_token,
        token_type,
        expires_at,
        platform_user_id,
        platform_username,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
      [
        djId,
        'instagram',
        encryptedAccessToken,
        encryptedRefreshToken,
        tokenData.token_type || 'Bearer',
        expiresAt,
        tokenData.user_id,
        tokenData.username
      ]
    );

    // Update or create social_connections
    await client.query(
      `INSERT INTO social_connections (
        dj_id,
        platform,
        connection_type,
        is_active,
        username,
        last_sync,
        last_sync_status
      ) VALUES ($1, 'instagram', 'oauth', true, $2, CURRENT_TIMESTAMP, 'success')
      ON CONFLICT (dj_id, platform)
      DO UPDATE SET
        connection_type = 'oauth',
        is_active = true,
        username = $2,
        last_sync = CURRENT_TIMESTAMP,
        last_sync_status = 'success',
        sync_error_message = NULL`,
      [djId, tokenData.username]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
