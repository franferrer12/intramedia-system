/**
 * Social Media Integration Service
 * Conecta con APIs de redes sociales en tiempo real
 */

import axios from 'axios';
import db from '../config/database.js';

class SocialMediaService {
  constructor() {
    // Configuración de APIs
    this.apis = {
      instagram: {
        baseUrl: 'https://graph.instagram.com',
        version: 'v18.0'
      },
      tiktok: {
        baseUrl: 'https://open-api.tiktok.com',
        version: 'v1.3'
      },
      youtube: {
        baseUrl: 'https://www.googleapis.com/youtube/v3',
        apiKey: process.env.YOUTUBE_API_KEY
      },
      spotify: {
        baseUrl: 'https://api.spotify.com/v1',
        authUrl: 'https://accounts.spotify.com/api/token'
      },
      soundcloud: {
        baseUrl: 'https://api.soundcloud.com',
        clientId: process.env.SOUNDCLOUD_CLIENT_ID
      },
      facebook: {
        baseUrl: 'https://graph.facebook.com',
        version: 'v18.0'
      },
      twitter: {
        baseUrl: 'https://api.twitter.com/2',
        bearerToken: process.env.TWITTER_BEARER_TOKEN
      }
    };
  }

  /**
   * Obtener todas las métricas de un DJ
   */
  async getAllMetrics(djId) {
    try {
      // Obtener tokens vinculados
      const tokens = await this.getLinkedAccounts(djId);

      const metrics = {
        lastUpdate: new Date(),
        platforms: {}
      };

      // Fetch en paralelo de todas las plataformas vinculadas
      const promises = [];

      if (tokens.instagram) {
        promises.push(
          this.getInstagramMetrics(tokens.instagram)
            .then(data => { metrics.platforms.instagram = data; })
            .catch(err => { console.error('Instagram error:', err); })
        );
      }

      if (tokens.tiktok) {
        promises.push(
          this.getTikTokMetrics(tokens.tiktok)
            .then(data => { metrics.platforms.tiktok = data; })
            .catch(err => { console.error('TikTok error:', err); })
        );
      }

      if (tokens.youtube) {
        promises.push(
          this.getYouTubeMetrics(tokens.youtube)
            .then(data => { metrics.platforms.youtube = data; })
            .catch(err => { console.error('YouTube error:', err); })
        );
      }

      if (tokens.spotify) {
        promises.push(
          this.getSpotifyMetrics(tokens.spotify)
            .then(data => { metrics.platforms.spotify = data; })
            .catch(err => { console.error('Spotify error:', err); })
        );
      }

      if (tokens.soundcloud) {
        promises.push(
          this.getSoundCloudMetrics(tokens.soundcloud)
            .then(data => { metrics.platforms.soundcloud = data; })
            .catch(err => { console.error('SoundCloud error:', err); })
        );
      }

      if (tokens.facebook) {
        promises.push(
          this.getFacebookMetrics(tokens.facebook)
            .then(data => { metrics.platforms.facebook = data; })
            .catch(err => { console.error('Facebook error:', err); })
        );
      }

      if (tokens.twitter) {
        promises.push(
          this.getTwitterMetrics(tokens.twitter)
            .then(data => { metrics.platforms.twitter = data; })
            .catch(err => { console.error('Twitter error:', err); })
        );
      }

      await Promise.all(promises);

      // Guardar snapshot en BD
      await this.saveSnapshot(djId, metrics);

      return metrics;
    } catch (error) {
      console.error('Error obteniendo métricas:', error);
      throw error;
    }
  }

  /**
   * Instagram Business API
   */
  async getInstagramMetrics(accessToken) {
    try {
      // Get account info
      const accountRes = await axios.get(
        `${this.apis.instagram.baseUrl}/me`,
        {
          params: {
            fields: 'id,username,followers_count,media_count',
            access_token: accessToken
          }
        }
      );

      const account = accountRes.data;

      // Get insights (últimos 30 días)
      const insightsRes = await axios.get(
        `${this.apis.instagram.baseUrl}/${account.id}/insights`,
        {
          params: {
            metric: 'impressions,reach,profile_views,follower_count',
            period: 'day',
            since: Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60),
            until: Math.floor(Date.now() / 1000),
            access_token: accessToken
          }
        }
      );

      // Get recent media
      const mediaRes = await axios.get(
        `${this.apis.instagram.baseUrl}/${account.id}/media`,
        {
          params: {
            fields: 'id,caption,like_count,comments_count,timestamp,media_type,media_url',
            limit: 25,
            access_token: accessToken
          }
        }
      );

      // Calcular engagement
      const media = mediaRes.data.data || [];
      const totalEngagement = media.reduce((sum, post) =>
        sum + (post.like_count || 0) + (post.comments_count || 0), 0
      );
      const avgEngagement = media.length > 0 ? totalEngagement / media.length : 0;
      const engagementRate = account.followers_count > 0
        ? (avgEngagement / account.followers_count) * 100
        : 0;

      // Obtener datos históricos de BD para calcular cambios
      const historical = await this.getHistoricalData('instagram', account.id, 30);
      const previousFollowers = historical[0]?.followers || account.followers_count;
      const followersChange = account.followers_count - previousFollowers;
      const followersChangePercent = previousFollowers > 0
        ? (followersChange / previousFollowers) * 100
        : 0;

      return {
        followers: account.followers_count,
        followersChange,
        followersChangePercent,
        username: account.username,
        posts: account.media_count,
        engagement: engagementRate,
        reach: insightsRes.data.data.find(d => d.name === 'reach')?.values[0]?.value || 0,
        impressions: insightsRes.data.data.find(d => d.name === 'impressions')?.values[0]?.value || 0,
        avgLikes: media.reduce((sum, p) => sum + (p.like_count || 0), 0) / media.length,
        avgComments: media.reduce((sum, p) => sum + (p.comments_count || 0), 0) / media.length,
        topPost: media.reduce((top, post) => {
          const engagement = (post.like_count || 0) + (post.comments_count || 0);
          const topEngagement = (top?.like_count || 0) + (top?.comments_count || 0);
          return engagement > topEngagement ? post : top;
        }, null),
        recentMedia: media.slice(0, 10),
        evolution: historical
      };
    } catch (error) {
      console.error('Instagram API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * TikTok API
   */
  async getTikTokMetrics(accessToken) {
    try {
      // User info
      const userRes = await axios.get(
        `${this.apis.tiktok.baseUrl}/user/info/`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          params: {
            fields: 'follower_count,following_count,likes_count,video_count'
          }
        }
      );

      // Videos (últimos 30 días)
      const videosRes = await axios.post(
        `${this.apis.tiktok.baseUrl}/video/list/`,
        {
          max_count: 20
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const user = userRes.data.data.user;
      const videos = videosRes.data.data.videos || [];

      const totalViews = videos.reduce((sum, v) => sum + (v.view_count || 0), 0);
      const avgViews = videos.length > 0 ? totalViews / videos.length : 0;

      const historical = await this.getHistoricalData('tiktok', user.id, 30);
      const previousFollowers = historical[0]?.followers || user.follower_count;
      const followersChange = user.follower_count - previousFollowers;
      const followersChangePercent = previousFollowers > 0
        ? (followersChange / previousFollowers) * 100
        : 0;

      return {
        followers: user.follower_count,
        followersChange,
        followersChangePercent,
        views: totalViews,
        viewsChange: 0, // Calcular desde historical
        likes: user.likes_count,
        videos: user.video_count,
        avgViews,
        viralVideos: videos.filter(v => v.view_count > avgViews * 3).length,
        evolution: historical,
        topVideos: videos.slice(0, 5)
      };
    } catch (error) {
      console.error('TikTok API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * YouTube Data API
   */
  async getYouTubeMetrics(channelId) {
    try {
      // Channel statistics
      const channelRes = await axios.get(
        `${this.apis.youtube.baseUrl}/channels`,
        {
          params: {
            part: 'statistics,snippet',
            id: channelId,
            key: this.apis.youtube.apiKey
          }
        }
      );

      const channel = channelRes.data.items[0];
      const stats = channel.statistics;

      // Recent videos
      const videosRes = await axios.get(
        `${this.apis.youtube.baseUrl}/search`,
        {
          params: {
            part: 'snippet',
            channelId: channelId,
            maxResults: 25,
            order: 'date',
            type: 'video',
            key: this.apis.youtube.apiKey
          }
        }
      );

      const historical = await this.getHistoricalData('youtube', channelId, 30);
      const previousSubs = historical[0]?.subscribers || parseInt(stats.subscriberCount);
      const subsChange = parseInt(stats.subscriberCount) - previousSubs;
      const subsChangePercent = previousSubs > 0
        ? (subsChange / previousSubs) * 100
        : 0;

      return {
        subscribers: parseInt(stats.subscriberCount),
        subscribersChange: subsChange,
        subscribersChangePercent: subsChangePercent,
        views: parseInt(stats.viewCount),
        videos: parseInt(stats.videoCount),
        avgViewsPerVideo: parseInt(stats.viewCount) / parseInt(stats.videoCount),
        evolution: historical,
        recentVideos: videosRes.data.items.slice(0, 10)
      };
    } catch (error) {
      console.error('YouTube API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Spotify Web API
   */
  async getSpotifyMetrics(accessToken) {
    try {
      // Get artist info
      const artistRes = await axios.get(
        `${this.apis.spotify.baseUrl}/me`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const artistId = artistRes.data.id;

      // Get artist data
      const artistDataRes = await axios.get(
        `${this.apis.spotify.baseUrl}/artists/${artistId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      // Get top tracks
      const topTracksRes = await axios.get(
        `${this.apis.spotify.baseUrl}/artists/${artistId}/top-tracks`,
        {
          params: { market: 'ES' },
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const followers = artistDataRes.data.followers.total;

      const historical = await this.getHistoricalData('spotify', artistId, 30);
      const previousFollowers = historical[0]?.listeners || followers;
      const followersChange = followers - previousFollowers;
      const followersChangePercent = previousFollowers > 0
        ? (followersChange / previousFollowers) * 100
        : 0;

      return {
        monthlyListeners: followers,
        listenersChange: followersChange,
        listenersChangePercent: followersChangePercent,
        topTrack: topTracksRes.data.tracks[0],
        topTracks: topTracksRes.data.tracks.slice(0, 10),
        evolution: historical
      };
    } catch (error) {
      console.error('Spotify API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * SoundCloud API
   */
  async getSoundCloudMetrics(userId) {
    try {
      const userRes = await axios.get(
        `${this.apis.soundcloud.baseUrl}/users/${userId}`,
        {
          params: {
            client_id: this.apis.soundcloud.clientId
          }
        }
      );

      const tracksRes = await axios.get(
        `${this.apis.soundcloud.baseUrl}/users/${userId}/tracks`,
        {
          params: {
            client_id: this.apis.soundcloud.clientId,
            limit: 50
          }
        }
      );

      const user = userRes.data;
      const tracks = tracksRes.data;

      const totalPlays = tracks.reduce((sum, t) => sum + (t.playback_count || 0), 0);

      const historical = await this.getHistoricalData('soundcloud', userId, 30);
      const previousFollowers = historical[0]?.followers || user.followers_count;
      const followersChange = user.followers_count - previousFollowers;
      const followersChangePercent = previousFollowers > 0
        ? (followersChange / previousFollowers) * 100
        : 0;

      return {
        followers: user.followers_count,
        followersChange,
        followersChangePercent,
        plays: totalPlays,
        tracks: user.track_count,
        likes: user.likes_count,
        evolution: historical
      };
    } catch (error) {
      console.error('SoundCloud API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Facebook Graph API
   */
  async getFacebookMetrics(accessToken) {
    try {
      const pageRes = await axios.get(
        `${this.apis.facebook.baseUrl}/me`,
        {
          params: {
            fields: 'id,name,followers_count,fan_count,engagement',
            access_token: accessToken
          }
        }
      );

      const insightsRes = await axios.get(
        `${this.apis.facebook.baseUrl}/${pageRes.data.id}/insights`,
        {
          params: {
            metric: 'page_impressions,page_engaged_users,page_post_engagements',
            period: 'day',
            access_token: accessToken
          }
        }
      );

      const page = pageRes.data;

      const historical = await this.getHistoricalData('facebook', page.id, 30);
      const previousFollowers = historical[0]?.followers || page.followers_count;
      const followersChange = page.followers_count - previousFollowers;
      const followersChangePercent = previousFollowers > 0
        ? (followersChange / previousFollowers) * 100
        : 0;

      return {
        followers: page.followers_count,
        followersChange,
        followersChangePercent,
        engagement: page.engagement?.rate || 0,
        evolution: historical
      };
    } catch (error) {
      console.error('Facebook API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Twitter API v2
   */
  async getTwitterMetrics(userId) {
    try {
      const userRes = await axios.get(
        `${this.apis.twitter.baseUrl}/users/${userId}`,
        {
          params: {
            'user.fields': 'public_metrics'
          },
          headers: {
            'Authorization': `Bearer ${this.apis.twitter.bearerToken}`
          }
        }
      );

      const user = userRes.data.data;
      const metrics = user.public_metrics;

      const historical = await this.getHistoricalData('twitter', userId, 30);
      const previousFollowers = historical[0]?.followers || metrics.followers_count;
      const followersChange = metrics.followers_count - previousFollowers;
      const followersChangePercent = previousFollowers > 0
        ? (followersChange / previousFollowers) * 100
        : 0;

      return {
        followers: metrics.followers_count,
        followersChange,
        followersChangePercent,
        tweets: metrics.tweet_count,
        evolution: historical
      };
    } catch (error) {
      console.error('Twitter API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obtener cuentas vinculadas de un DJ
   */
  async getLinkedAccounts(djId) {
    const result = await db.query(
      `SELECT platform, access_token, refresh_token, platform_user_id, expires_at
       FROM social_media_accounts
       WHERE dj_id = $1 AND active = true`,
      [djId]
    );

    const tokens = {};
    for (const row of result.rows) {
      // Refresh token si es necesario
      if (row.expires_at && new Date(row.expires_at) < new Date()) {
        const newToken = await this.refreshToken(row.platform, row.refresh_token);
        tokens[row.platform] = newToken;
      } else {
        tokens[row.platform] = row.access_token || row.platform_user_id;
      }
    }

    return tokens;
  }

  /**
   * Guardar snapshot de métricas
   */
  async saveSnapshot(djId, metrics) {
    for (const [platform, data] of Object.entries(metrics.platforms)) {
      await db.query(
        `INSERT INTO social_media_snapshots
         (dj_id, platform, followers, engagement, data, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          djId,
          platform,
          data.followers || data.subscribers || data.monthlyListeners || 0,
          data.engagement || 0,
          JSON.stringify(data)
        ]
      );
    }
  }

  /**
   * Obtener datos históricos
   */
  async getHistoricalData(platform, platformUserId, days = 30) {
    const result = await db.query(
      `SELECT data, created_at
       FROM social_media_snapshots
       WHERE platform = $1
       AND data->>'id' = $2
       AND created_at >= NOW() - INTERVAL '${days} days'
       ORDER BY created_at ASC`,
      [platform, platformUserId]
    );

    return result.rows.map(row => ({
      date: row.created_at,
      ...JSON.parse(row.data)
    }));
  }

  /**
   * Refresh token de OAuth
   */
  async refreshToken(platform, refreshToken) {
    // Implementar refresh para cada plataforma
    // Cada una tiene su propio flujo
    throw new Error('Refresh token not implemented for ' + platform);
  }
}

export default new SocialMediaService();
