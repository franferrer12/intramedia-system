import db from '../config/database.js';
import scraperService from '../services/socialMediaScraperService.js';
import unifiedInstagramService from '../services/unifiedInstagramService.js';
import pdfReportService from '../services/pdfReportService.js';
import notificationService from '../services/notificationService.js';
import engagementPredictionService from '../services/engagementPredictionService.js';

/**
 * Social Media Controller - Username-based (No OAuth)
 * Works with public usernames only
 */

/**
 * POST /api/social-media/:djId/link
 * Link a social media account by username
 */
export const linkAccount = async (req, res) => {
  try {
    const { djId } = req.params;
    const { platform, platform_username } = req.body;

    if (!platform || !platform_username) {
      return res.status(400).json({
        success: false,
        error: 'Platform and username are required'
      });
    }

    // Insert or update account
    const result = await db.query(
      `INSERT INTO social_media_accounts
       (dj_id, platform, platform_username, active)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (dj_id, platform)
       DO UPDATE SET
         platform_username = EXCLUDED.platform_username,
         active = true,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [djId, platform, platform_username]
    );

    // Fetch initial metrics (pass djId for cache lookup)
    let metrics;
    switch (platform) {
      case 'instagram':
        // Use unified service for Instagram (handles OAuth + Scraping)
        const result = await unifiedInstagramService.linkInstagramByUsername(djId, platform_username);
        metrics = result.data;
        break;
      case 'tiktok':
        metrics = await scraperService.fetchTikTokMetrics(platform_username);
        break;
      case 'youtube':
        metrics = await scraperService.fetchYouTubeMetrics(platform_username);
        break;
      case 'spotify':
        metrics = await scraperService.fetchSpotifyMetrics(platform_username);
        break;
      case 'soundcloud':
        metrics = await scraperService.fetchSoundCloudMetrics(platform_username);
        break;
      case 'facebook':
        metrics = await scraperService.fetchFacebookMetrics(platform_username);
        break;
      case 'twitter':
        metrics = await scraperService.fetchTwitterMetrics(platform_username);
        break;
      default:
        metrics = { success: false, error: 'Platform not supported' };
    }

    // Save snapshot if metrics were fetched successfully
    if (metrics.success) {
      await saveSnapshot(djId, platform, metrics);
    }

    res.json({
      success: true,
      message: `Cuenta de ${platform} vinculada correctamente`,
      data: result.rows[0],
      metrics: metrics
    });
  } catch (error) {
    console.error('Error linking account:', error);
    res.status(500).json({
      success: false,
      error: 'Error al vincular cuenta'
    });
  }
};

/**
 * GET /api/social-media/:djId/linked
 * Get all linked accounts for a DJ
 */
export const getLinkedAccounts = async (req, res) => {
  try {
    const { djId } = req.params;

    const result = await db.query(
      `SELECT
        id,
        platform,
        platform_username,
        active,
        created_at,
        updated_at
       FROM social_media_accounts
       WHERE dj_id = $1
       ORDER BY platform`,
      [djId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting linked accounts:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener cuentas vinculadas'
    });
  }
};

/**
 * DELETE /api/social-media/:djId/unlink/:platform
 * Unlink a social media account
 */
export const unlinkAccount = async (req, res) => {
  try {
    const { djId, platform } = req.params;

    await db.query(
      `UPDATE social_media_accounts
       SET active = false, updated_at = CURRENT_TIMESTAMP
       WHERE dj_id = $1 AND platform = $2`,
      [djId, platform]
    );

    res.json({
      success: true,
      message: `Cuenta de ${platform} desvinculada`
    });
  } catch (error) {
    console.error('Error unlinking account:', error);
    res.status(500).json({
      success: false,
      error: 'Error al desvincular cuenta'
    });
  }
};

/**
 * GET /api/social-media/:djId/metrics
 * Get all social media metrics for a DJ
 * Query param: refresh=true to fetch fresh data
 */
export const getSocialMetrics = async (req, res) => {
  try {
    const { djId } = req.params;
    const { refresh } = req.query;

    // Get linked accounts
    const accountsResult = await db.query(
      `SELECT id, platform, platform_username, active
       FROM social_media_accounts
       WHERE dj_id = $1 AND active = true`,
      [djId]
    );

    const accounts = accountsResult.rows;

    if (accounts.length === 0) {
      return res.json({
        success: true,
        data: {
          platforms: {},
          message: 'No hay cuentas vinculadas'
        }
      });
    }

    let metrics = {};

    if (refresh === 'true') {
      // Fetch fresh data from platforms (pass djId for cache)
      console.log(`Fetching fresh metrics for DJ ${djId}...`);

      // Use unified service for Instagram, regular scraper for others
      for (const account of accounts) {
        if (account.platform === 'instagram') {
          try {
            const instagramData = await unifiedInstagramService.getInstagramData(djId, { forceRefresh: true });
            metrics.instagram = instagramData;
          } catch (error) {
            console.error('Error fetching Instagram data:', error);
            metrics.instagram = { success: false, error: error.message };
          }
        } else {
          // Use regular scraper for other platforms
          const platformMetrics = await scraperService.fetchAllMetricsForDJ([account], djId, { forceRefresh: true });
          metrics = { ...metrics, ...platformMetrics };
        }
      }

      // Save snapshots
      for (const [platform, data] of Object.entries(metrics)) {
        if (data.success) {
          await saveSnapshot(djId, platform, data);
        }
      }
    } else {
      // Get latest snapshot from database
      for (const account of accounts) {
        const snapshotResult = await db.query(
          `SELECT
            platform,
            followers,
            engagement,
            data,
            created_at as last_update
           FROM social_media_snapshots
           WHERE dj_id = $1 AND platform = $2
           ORDER BY created_at DESC
           LIMIT 1`,
          [djId, account.platform]
        );

        if (snapshotResult.rows.length > 0) {
          const snapshot = snapshotResult.rows[0];
          try {
            // Parse data safely - handle both JSON strings and objects
            let parsedData = snapshot.data;
            if (typeof parsedData === 'string') {
              parsedData = JSON.parse(parsedData);
            }
            metrics[account.platform] = {
              ...parsedData,
              lastUpdate: snapshot.last_update
            };
          } catch (parseError) {
            console.error(`Error parsing snapshot data for ${account.platform}:`, parseError.message);
            // Skip this platform if data is corrupted
          }
        }
      }
    }

    res.json({
      success: true,
      data: {
        platforms: metrics,
        lastUpdate: new Date()
      }
    });
  } catch (error) {
    console.error('Error getting social metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener métricas de redes sociales'
    });
  }
};

/**
 * POST /api/social-media/:djId/refresh
 * Force refresh metrics for a specific platform or all platforms
 */
export const refreshMetrics = async (req, res) => {
  try {
    const { djId } = req.params;
    const { platform } = req.body;

    // Get accounts to refresh
    let query = `SELECT id, platform, platform_username, active
                 FROM social_media_accounts
                 WHERE dj_id = $1 AND active = true`;

    const params = [djId];

    if (platform) {
      query += ` AND platform = $2`;
      params.push(platform);
    }

    const accountsResult = await db.query(query, params);
    const accounts = accountsResult.rows;

    if (accounts.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron cuentas activas'
      });
    }

    // Fetch fresh metrics (pass djId for cache, force refresh)
    const metrics = await scraperService.fetchAllMetricsForDJ(accounts, djId, { forceRefresh: true });

    // Save snapshots
    for (const [plat, data] of Object.entries(metrics)) {
      if (data.success) {
        await saveSnapshot(djId, plat, data);
      }
    }

    res.json({
      success: true,
      message: 'Métricas actualizadas correctamente',
      data: metrics
    });
  } catch (error) {
    console.error('Error refreshing metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar métricas'
    });
  }
};

/**
 * GET /api/social-media/:djId/history/:platform
 * Get historical data for a platform
 */
export const getPlatformHistory = async (req, res) => {
  try {
    const { djId, platform } = req.params;
    const { days = 30 } = req.query;

    const result = await db.query(
      `SELECT
        followers,
        engagement,
        data,
        created_at as date
       FROM social_media_snapshots
       WHERE dj_id = $1
       AND platform = $2
       AND created_at >= NOW() - INTERVAL '${parseInt(days)} days'
       ORDER BY created_at ASC`,
      [djId, platform]
    );

    const history = result.rows.map(row => {
      try {
        // Parse data safely - handle both JSON strings and objects
        let parsedData = row.data;
        if (typeof parsedData === 'string') {
          parsedData = JSON.parse(parsedData);
        }
        return {
          date: row.date,
          followers: row.followers,
          engagement: row.engagement,
          ...parsedData
        };
      } catch (parseError) {
        console.error('Error parsing history data:', parseError.message);
        return {
          date: row.date,
          followers: row.followers,
          engagement: row.engagement
        };
      }
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error getting platform history:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener histórico'
    });
  }
};

/**
 * GET /api/social-media/:djId/summary
 * Get summary of all social media metrics
 */
export const getSocialSummary = async (req, res) => {
  try {
    const { djId } = req.params;

    // Get total followers across all platforms
    const result = await db.query(
      `SELECT
        COUNT(DISTINCT platform) as platforms_count,
        SUM(followers) as total_followers,
        AVG(engagement) as avg_engagement
       FROM (
         SELECT DISTINCT ON (platform)
           platform,
           followers,
           engagement
         FROM social_media_snapshots
         WHERE dj_id = $1
         ORDER BY platform, created_at DESC
       ) as latest_snapshots`,
      [djId]
    );

    const summary = result.rows[0];

    // Get growth trends (last 7 days vs previous 7 days)
    const trendsResult = await db.query(
      `WITH recent AS (
        SELECT SUM(followers) as followers
        FROM (
          SELECT DISTINCT ON (platform) platform, followers
          FROM social_media_snapshots
          WHERE dj_id = $1
          AND created_at >= NOW() - INTERVAL '7 days'
          ORDER BY platform, created_at DESC
        ) t
      ),
      previous AS (
        SELECT SUM(followers) as followers
        FROM (
          SELECT DISTINCT ON (platform) platform, followers
          FROM social_media_snapshots
          WHERE dj_id = $1
          AND created_at >= NOW() - INTERVAL '14 days'
          AND created_at < NOW() - INTERVAL '7 days'
          ORDER BY platform, created_at DESC
        ) t
      )
      SELECT
        recent.followers as recent_followers,
        previous.followers as previous_followers,
        CASE
          WHEN previous.followers > 0 THEN
            ((recent.followers - previous.followers)::float / previous.followers * 100)
          ELSE 0
        END as growth_percentage
      FROM recent, previous`,
      [djId]
    );

    const trends = trendsResult.rows[0];

    res.json({
      success: true,
      data: {
        platforms_count: parseInt(summary.platforms_count) || 0,
        total_followers: parseInt(summary.total_followers) || 0,
        avg_engagement: parseFloat(summary.avg_engagement) || 0,
        growth_percentage: parseFloat(trends?.growth_percentage) || 0,
        growth_trend: trends?.growth_percentage > 0 ? 'up' : trends?.growth_percentage < 0 ? 'down' : 'stable'
      }
    });
  } catch (error) {
    console.error('Error getting social summary:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener resumen'
    });
  }
};

// ============= HELPER FUNCTIONS =============

/**
 * Save metrics snapshot to database and detect changes for notifications
 */
async function saveSnapshot(djId, platform, metricsData) {
  try {
    const followers = metricsData.followers || metricsData.subscribers || 0;
    const engagement = metricsData.engagement || metricsData.engagement_rate || 0;

    // Get previous snapshot for comparison (Instagram only for now)
    if (platform === 'instagram') {
      const previousSnapshot = await db.query(
        `SELECT data FROM social_media_snapshots
         WHERE dj_id = $1 AND platform = $2
         ORDER BY created_at DESC
         LIMIT 1`,
        [djId, platform]
      );

      let oldMetrics = null;
      if (previousSnapshot.rows.length > 0) {
        try {
          const snapshotData = previousSnapshot.rows[0].data;
          oldMetrics = typeof snapshotData === 'string' ? JSON.parse(snapshotData) : snapshotData;

          // Extract metrics properly
          if (oldMetrics.metrics) {
            oldMetrics = {
              followers: oldMetrics.metrics.followers || oldMetrics.followers || 0,
              engagement_rate: oldMetrics.metrics.engagement_rate || oldMetrics.engagement_rate || oldMetrics.engagement || 0,
              top_post: oldMetrics.top_post
            };
          }
        } catch (parseError) {
          console.error('Error parsing previous snapshot:', parseError);
        }
      }

      // Analyze and create notifications
      const newMetrics = {
        followers: metricsData.followers || metricsData.metrics?.followers || 0,
        engagement_rate: metricsData.engagement_rate || metricsData.metrics?.engagement_rate || metricsData.engagement || 0,
        top_post: metricsData.top_post
      };

      await notificationService.analyzeAndNotify(djId, newMetrics, oldMetrics);
    }

    // Save new snapshot
    await db.query(
      `INSERT INTO social_media_snapshots
       (dj_id, platform, followers, engagement, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [djId, platform, followers, engagement, JSON.stringify(metricsData)]
    );
  } catch (error) {
    console.error(`Error saving snapshot for ${platform}:`, error);
  }
}

/**
 * GET /api/social-media/:djId/instagram
 * Get Instagram data using unified service (OAuth or Scraping)
 */
export const getInstagramData = async (req, res) => {
  try {
    const { djId } = req.params;
    const { refresh } = req.query;

    const data = await unifiedInstagramService.getInstagramData(
      parseInt(djId),
      { forceRefresh: refresh === 'true' }
    );

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting Instagram data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener datos de Instagram'
    });
  }
};

/**
 * GET /api/social-media/:djId/instagram/status
 * Get Instagram connection status
 */
export const getInstagramStatus = async (req, res) => {
  try {
    const { djId } = req.params;

    const status = await unifiedInstagramService.getConnectionStatus(parseInt(djId));

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting Instagram status:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estado de Instagram'
    });
  }
};

/**
 * GET /api/social-media/:djId/instagram/report/pdf
 * Generate PDF report for Instagram analytics
 */
export const generateInstagramPDFReport = async (req, res) => {
  try {
    const { djId } = req.params;

    // Get Instagram data
    const instagramData = await unifiedInstagramService.getInstagramData(
      parseInt(djId),
      { forceRefresh: false }
    );

    if (!instagramData || !instagramData.success) {
      return res.status(404).json({
        success: false,
        error: 'No Instagram data available for this DJ'
      });
    }

    // Generate PDF
    const pdfStream = await pdfReportService.generateInstagramReport(djId, instagramData);

    // Set response headers
    const username = instagramData.profile?.username || instagramData.username || 'dj';
    const filename = `instagram-report-${username}-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe PDF to response
    pdfStream.pipe(res);

  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar reporte PDF'
    });
  }
};

/**
 * POST /api/social-media/compare
 * Compare Instagram metrics across multiple DJs
 * Body: { djIds: [1, 2, 3] }
 */
export const compareDJs = async (req, res) => {
  try {
    const { djIds } = req.body;

    if (!djIds || !Array.isArray(djIds) || djIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un array de IDs de DJs'
      });
    }

    if (djIds.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Máximo 10 DJs para comparar'
      });
    }

    // Fetch data for each DJ
    const comparisons = [];

    for (const djId of djIds) {
      try {
        // Get DJ info
        const djResult = await db.query(
          'SELECT id, nombre, email FROM djs WHERE id = $1',
          [djId]
        );

        if (djResult.rows.length === 0) {
          continue; // Skip if DJ not found
        }

        const djInfo = djResult.rows[0];

        // Get Instagram data
        const instagramData = await unifiedInstagramService.getInstagramData(
          parseInt(djId),
          { forceRefresh: false }
        );

        if (instagramData && instagramData.success) {
          const metrics = instagramData.metrics || {};

          comparisons.push({
            djId: djId,
            djName: djInfo.nombre,
            instagram: {
              username: instagramData.profile?.username || instagramData.username || 'N/A',
              followers: metrics.followers || 0,
              following: metrics.following || 0,
              posts: metrics.posts || 0,
              engagement_rate: metrics.engagement_rate || 0,
              avg_likes: metrics.avg_likes || 0,
              avg_comments: metrics.avg_comments || 0,
              follower_ratio: metrics.following > 0
                ? (metrics.followers / metrics.following).toFixed(2)
                : 0
            },
            lastUpdate: instagramData.lastUpdate || new Date()
          });
        }
      } catch (error) {
        console.error(`Error fetching data for DJ ${djId}:`, error);
        // Continue with next DJ
      }
    }

    if (comparisons.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron datos para los DJs especificados'
      });
    }

    // Calculate rankings
    const rankings = calculateRankings(comparisons);

    res.json({
      success: true,
      data: {
        comparisons,
        rankings,
        totalDJs: comparisons.length
      }
    });

  } catch (error) {
    console.error('Error comparing DJs:', error);
    res.status(500).json({
      success: false,
      error: 'Error al comparar DJs'
    });
  }
};

/**
 * Helper function to calculate rankings from comparison data
 */
function calculateRankings(comparisons) {
  // Sort by different metrics
  const byFollowers = [...comparisons].sort((a, b) =>
    b.instagram.followers - a.instagram.followers
  );

  const byEngagement = [...comparisons].sort((a, b) =>
    b.instagram.engagement_rate - a.instagram.engagement_rate
  );

  const byRatio = [...comparisons].sort((a, b) =>
    parseFloat(b.instagram.follower_ratio) - parseFloat(a.instagram.follower_ratio)
  );

  return {
    mostFollowers: byFollowers.slice(0, 3).map((dj, idx) => ({
      rank: idx + 1,
      djId: dj.djId,
      djName: dj.djName,
      followers: dj.instagram.followers
    })),
    bestEngagement: byEngagement.slice(0, 3).map((dj, idx) => ({
      rank: idx + 1,
      djId: dj.djId,
      djName: dj.djName,
      engagement_rate: dj.instagram.engagement_rate
    })),
    bestRatio: byRatio.slice(0, 3).map((dj, idx) => ({
      rank: idx + 1,
      djId: dj.djId,
      djName: dj.djName,
      follower_ratio: dj.instagram.follower_ratio
    }))
  };
}

/**
 * GET /api/social-media/:djId/instagram/hashtags
 * Analyze hashtags from Instagram posts
 */
export const getInstagramHashtags = async (req, res) => {
  try {
    const { djId } = req.params;
    const { limit = 20 } = req.query;

    // Get Instagram data
    const instagramData = await unifiedInstagramService.getInstagramData(
      parseInt(djId),
      { forceRefresh: false }
    );

    if (!instagramData || !instagramData.success) {
      return res.status(404).json({
        success: false,
        error: 'No Instagram data available for this DJ'
      });
    }

    // Extract hashtags from recent posts
    const posts = instagramData.recent_posts || [];
    const hashtagCounts = {};
    const hashtagPosts = {};

    posts.forEach(post => {
      const caption = post.caption || post.text || '';
      const hashtags = extractHashtags(caption);

      hashtags.forEach(hashtag => {
        // Count occurrences
        if (!hashtagCounts[hashtag]) {
          hashtagCounts[hashtag] = 0;
          hashtagPosts[hashtag] = [];
        }
        hashtagCounts[hashtag]++;

        // Store post info for this hashtag
        if (hashtagPosts[hashtag].length < 3) {
          hashtagPosts[hashtag].push({
            likes: post.likes || 0,
            comments: post.comments || 0,
            timestamp: post.timestamp || post.date
          });
        }
      });
    });

    // Convert to sorted array
    const sortedHashtags = Object.entries(hashtagCounts)
      .map(([hashtag, count]) => {
        const postsWithHashtag = hashtagPosts[hashtag];
        const totalEngagement = postsWithHashtag.reduce(
          (sum, p) => sum + p.likes + p.comments,
          0
        );
        const avgEngagement = postsWithHashtag.length > 0
          ? totalEngagement / postsWithHashtag.length
          : 0;

        return {
          hashtag,
          count,
          avgEngagement: Math.round(avgEngagement),
          examples: postsWithHashtag
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, parseInt(limit));

    // Calculate statistics
    const totalHashtags = Object.keys(hashtagCounts).length;
    const totalPosts = posts.length;
    const avgHashtagsPerPost = totalPosts > 0
      ? (Object.values(hashtagCounts).reduce((sum, count) => sum + count, 0) / totalPosts).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        hashtags: sortedHashtags,
        stats: {
          totalHashtags,
          totalPosts,
          avgHashtagsPerPost: parseFloat(avgHashtagsPerPost)
        }
      }
    });

  } catch (error) {
    console.error('Error analyzing hashtags:', error);
    res.status(500).json({
      success: false,
      error: 'Error al analizar hashtags'
    });
  }
};

/**
 * Helper function to extract hashtags from text
 */
function extractHashtags(text) {
  if (!text) return [];

  // Match hashtags (including international characters)
  const hashtagRegex = /#[\w\u00C0-\u024F\u1E00-\u1EFF]+/g;
  const matches = text.match(hashtagRegex) || [];

  // Clean and deduplicate
  return [...new Set(
    matches.map(tag => tag.toLowerCase())
  )];
}

/**
 * GET /api/social-media/:djId/notifications
 * Get notifications for a DJ
 */
export const getNotifications = async (req, res) => {
  try {
    const { djId } = req.params;
    const { limit, unreadOnly } = req.query;

    const notifications = await notificationService.getNotifications(parseInt(djId), {
      limit: limit ? parseInt(limit) : 20,
      unreadOnly: unreadOnly === 'true'
    });

    const unreadCount = await notificationService.getUnreadCount(parseInt(djId));

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener notificaciones'
    });
  }
};

/**
 * POST /api/social-media/:djId/notifications/:notificationId/read
 * Mark notification as read
 */
export const markNotificationAsRead = async (req, res) => {
  try {
    const { djId, notificationId } = req.params;

    await notificationService.markAsRead(parseInt(notificationId), parseInt(djId));

    res.json({
      success: true,
      message: 'Notificación marcada como leída'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Error al marcar notificación'
    });
  }
};

/**
 * POST /api/social-media/:djId/notifications/read-all
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { djId } = req.params;

    await notificationService.markAllAsRead(parseInt(djId));

    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Error al marcar notificaciones'
    });
  }
};

/**
 * GET /api/social-media/:djId/instagram/predictions
 * Get AI-powered engagement predictions and recommendations
 */
export const getEngagementPredictions = async (req, res) => {
  try {
    const { djId } = req.params;

    const predictions = await engagementPredictionService.getPredictions(parseInt(djId));

    res.json(predictions);
  } catch (error) {
    console.error('Error getting engagement predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener predicciones de engagement'
    });
  }
};

export default {
  linkAccount,
  getLinkedAccounts,
  unlinkAccount,
  getSocialMetrics,
  refreshMetrics,
  getPlatformHistory,
  getSocialSummary,
  getInstagramData,
  getInstagramStatus,
  generateInstagramPDFReport,
  compareDJs,
  getInstagramHashtags,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getEngagementPredictions
};
