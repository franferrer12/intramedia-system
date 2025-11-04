import {
  exchangeCodeForToken,
  getLongLivedToken,
  getInstagramProfile,
  saveOAuthToken,
  getCompleteInstagramAnalytics,
  refreshLongLivedToken
} from '../services/instagramGraphService.js';
import pool from '../config/database.js';
import { decrypt } from '../services/encryptionService.js';

/**
 * Initiate Instagram OAuth flow
 * GET /api/oauth/instagram/authorize
 */
export const initiateInstagramAuth = async (req, res) => {
  try {
    const { djId } = req.query;

    if (!djId) {
      return res.status(400).json({
        success: false,
        message: 'DJ ID is required'
      });
    }

    // Verify DJ exists
    const djResult = await pool.query('SELECT id FROM djs WHERE id = $1', [djId]);

    if (djResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'DJ not found'
      });
    }

    const appId = process.env.INSTAGRAM_APP_ID;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    if (!appId || appId === 'your_instagram_app_id_here') {
      return res.status(500).json({
        success: false,
        message: 'Instagram OAuth is not configured. Please set INSTAGRAM_APP_ID in environment variables.'
      });
    }

    // Build Instagram OAuth URL
    const scopes = [
      'instagram_basic',
      'instagram_content_publish',
      'pages_show_list',
      'pages_read_engagement'
    ].join(',');

    const authUrl = `https://api.instagram.com/oauth/authorize?` +
      `client_id=${appId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `response_type=code&` +
      `state=${djId}`; // Pass DJ ID in state param

    // Redirect to Instagram auth
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Instagram auth:', error);
    res.status(500).json({
      success: false,
      message: 'Error initiating Instagram authentication',
      error: error.message
    });
  }
};

/**
 * Handle Instagram OAuth callback
 * GET /api/oauth/instagram/callback
 */
export const instagramCallback = async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    // Check for OAuth errors
    if (error) {
      console.error('Instagram OAuth error:', error, error_description);
      return res.redirect(
        `${process.env.FRONTEND_URL}/djs/${state}/instagram-connect?error=${encodeURIComponent(error_description || error)}`
      );
    }

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        message: 'Missing authorization code or DJ ID'
      });
    }

    const djId = parseInt(state);

    // Step 1: Exchange code for short-lived token
    console.log('📱 [Instagram OAuth] Exchanging code for token...');
    const shortLivedToken = await exchangeCodeForToken(code);

    // Step 2: Exchange short-lived for long-lived token
    console.log('📱 [Instagram OAuth] Getting long-lived token...');
    const longLivedToken = await getLongLivedToken(shortLivedToken.access_token);

    // Step 3: Get user profile
    console.log('📱 [Instagram OAuth] Fetching user profile...');
    const profile = await getInstagramProfile(longLivedToken.access_token);

    // Step 4: Save token to database
    console.log('📱 [Instagram OAuth] Saving token to database...');
    await saveOAuthToken(djId, {
      access_token: longLivedToken.access_token,
      token_type: longLivedToken.token_type,
      expires_in: longLivedToken.expires_in,
      user_id: profile.id,
      username: profile.username
    });

    console.log(`✅ [Instagram OAuth] Successfully connected @${profile.username} for DJ ${djId}`);

    // Redirect to success page
    res.redirect(
      `${process.env.FRONTEND_URL}/djs/${djId}/instagram-connect?success=true&username=${profile.username}`
    );
  } catch (error) {
    console.error('Error in Instagram callback:', error);

    const djId = req.query.state;
    res.redirect(
      `${process.env.FRONTEND_URL}/djs/${djId}/instagram-connect?error=${encodeURIComponent(error.message)}`
    );
  }
};

/**
 * Disconnect Instagram account
 * DELETE /api/oauth/instagram/disconnect/:djId
 */
export const disconnectInstagram = async (req, res) => {
  try {
    const { djId } = req.params;

    // Deactivate OAuth tokens
    await pool.query(
      'UPDATE oauth_tokens SET is_active = false WHERE dj_id = $1 AND platform = $2',
      [djId, 'instagram']
    );

    // Update social_connections to switch back to scraping
    await pool.query(
      `UPDATE social_connections
       SET connection_type = 'scraping',
           is_active = true
       WHERE dj_id = $1 AND platform = $2`,
      [djId, 'instagram']
    );

    res.json({
      success: true,
      message: 'Instagram account disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting Instagram:', error);
    res.status(500).json({
      success: false,
      message: 'Error disconnecting Instagram account',
      error: error.message
    });
  }
};

/**
 * Get Instagram connection status for a DJ
 * GET /api/oauth/instagram/status/:djId
 */
export const getInstagramStatus = async (req, res) => {
  try {
    const { djId } = req.params;

    const result = await pool.query(
      `SELECT
        sc.connection_type,
        sc.is_active,
        sc.username,
        sc.last_sync,
        sc.last_sync_status,
        sc.sync_error_message,
        ot.expires_at,
        ot.platform_user_id
      FROM social_connections sc
      LEFT JOIN oauth_tokens ot ON
        sc.dj_id = ot.dj_id AND
        sc.platform = ot.platform AND
        ot.is_active = true
      WHERE sc.dj_id = $1 AND sc.platform = 'instagram'`,
      [djId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          connected: false,
          connection_type: null,
          username: null
        }
      });
    }

    const status = result.rows[0];

    res.json({
      success: true,
      data: {
        connected: status.is_active,
        connection_type: status.connection_type,
        username: status.username,
        last_sync: status.last_sync,
        last_sync_status: status.last_sync_status,
        sync_error: status.sync_error_message,
        token_expires_at: status.expires_at,
        token_expired: status.expires_at ? new Date(status.expires_at) < new Date() : null
      }
    });
  } catch (error) {
    console.error('Error getting Instagram status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting Instagram connection status',
      error: error.message
    });
  }
};

/**
 * Get Instagram analytics (OAuth data)
 * GET /api/oauth/instagram/analytics/:djId
 */
export const getInstagramAnalytics = async (req, res) => {
  try {
    const { djId } = req.params;

    const analytics = await getCompleteInstagramAnalytics(parseInt(djId));

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting Instagram analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching Instagram analytics',
      error: error.message
    });
  }
};

/**
 * Manually refresh Instagram token
 * POST /api/oauth/instagram/refresh/:djId
 */
export const refreshInstagramToken = async (req, res) => {
  try {
    const { djId } = req.params;

    // Get current token
    const tokenResult = await pool.query(
      `SELECT id, access_token, expires_at
       FROM oauth_tokens
       WHERE dj_id = $1 AND platform = 'instagram' AND is_active = true`,
      [djId]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active Instagram connection found'
      });
    }

    const currentToken = tokenResult.rows[0];
    const decryptedToken = decrypt(currentToken.access_token);

    // Refresh token
    console.log(`🔄 [Instagram] Refreshing token for DJ ${djId}...`);
    const newTokenData = await refreshLongLivedToken(decryptedToken);

    // Get user profile with new token
    const profile = await getInstagramProfile(newTokenData.access_token);

    // Save refreshed token
    await saveOAuthToken(parseInt(djId), {
      access_token: newTokenData.access_token,
      token_type: newTokenData.token_type,
      expires_in: newTokenData.expires_in,
      user_id: profile.id,
      username: profile.username
    });

    console.log(`✅ [Instagram] Token refreshed successfully for DJ ${djId}`);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        expires_at: new Date(Date.now() + newTokenData.expires_in * 1000)
      }
    });
  } catch (error) {
    console.error('Error refreshing Instagram token:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing Instagram token',
      error: error.message
    });
  }
};
