import axios from 'axios';
import * as cheerio from 'cheerio';
import instagramService from './instagramService.js';

/**
 * Social Media Scraper Service - Public Data Only
 * Fetches public metrics from social media platforms using usernames
 * No authentication required
 */

/**
 * Instagram - Uses specialized Instagram service with cache
 * Fetches public profile data using username
 *
 * @param {string} username - Instagram username
 * @param {string|null} accessToken - Optional Instagram Graph API token
 * @param {number|null} djId - Optional DJ ID for cache lookup
 * @param {object} options - Scraping options
 */
export const fetchInstagramMetrics = async (username, accessToken = null, djId = null, options = {}) => {
  try {
    // Use advanced Instagram service with cache layer
    const data = await instagramService.fetchInstagramData(username, accessToken, djId, {
      forceRefresh: options.forceRefresh || false,
      skipPlaywright: options.skipPlaywright || false,
      useMock: options.useMock || false,
      maxRetries: options.maxRetries || 2
    });

    if (!data.success) {
      throw new Error(data.error || 'No se pudo obtener datos de Instagram');
    }

    // Transform to expected format
    return {
      platform: 'instagram',
      method: data.method,
      is_mock: data.is_mock || false,
      cached: data.cached || false,
      cache_age_hours: data.cache_age_hours || null,
      username: data.username,
      // Profile data
      profile: data.profile,
      // Main metrics
      followers: data.metrics.followers,
      following: data.metrics.following,
      posts: data.metrics.posts,
      engagement: data.metrics.engagement_rate,
      avg_likes: data.metrics.avg_likes,
      // Additional metrics (if available)
      impressions: data.metrics.impressions || 0,
      reach: data.metrics.reach || 0,
      profile_views: data.metrics.profile_views || 0,
      // Recent posts
      recent_posts: data.recent_posts || [],
      top_post: data.top_post || null,
      // Growth data
      growth: data.growth || null,
      // Metadata
      lastUpdate: data.last_update || new Date(),
      insights_period: data.insights_period || null,
      success: true
    };
  } catch (error) {
    console.error(`Error fetching Instagram metrics for ${username}:`, error.message);
    return {
      platform: 'instagram',
      username: username,
      error: error.message,
      success: false
    };
  }
};

/**
 * TikTok - Public Profile Scraper
 */
export const fetchTikTokMetrics = async (username) => {
  try {
    const url = `https://www.tiktok.com/@${username}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    // Extract data from script tags
    const scripts = $('script[type="application/json"]');
    let userData = null;

    scripts.each((i, el) => {
      try {
        const data = JSON.parse($(el).html());
        if (data.props?.pageProps?.userInfo) {
          userData = data.props.pageProps.userInfo;
        }
      } catch (e) {
        // Continue to next script
      }
    });

    if (!userData?.stats) {
      throw new Error('No se pudo obtener datos de TikTok');
    }

    return {
      platform: 'tiktok',
      username: username,
      followers: userData.stats.followerCount || 0,
      following: userData.stats.followingCount || 0,
      likes: userData.stats.heartCount || 0,
      videos: userData.stats.videoCount || 0,
      engagement: calculateTikTokEngagement(userData.stats),
      isVerified: userData.verified || false,
      lastUpdate: new Date(),
      success: true
    };
  } catch (error) {
    console.error(`Error fetching TikTok metrics for ${username}:`, error.message);
    return {
      platform: 'tiktok',
      username: username,
      error: error.message,
      success: false
    };
  }
};

/**
 * YouTube - Using YouTube Data API (no auth required for public data)
 */
export const fetchYouTubeMetrics = async (channelIdentifier) => {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      console.warn('YouTube API Key not configured, using mock data');
      return getMockYouTubeData(channelIdentifier);
    }

    // Determine if it's a username or channel ID
    let channelData;

    // Try as username first
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: {
          part: 'statistics,snippet',
          forUsername: channelIdentifier,
          key: apiKey
        },
        timeout: 10000
      });
      channelData = response.data.items?.[0];
    } catch (e) {
      // Try as channel ID
      const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: {
          part: 'statistics,snippet',
          id: channelIdentifier,
          key: apiKey
        },
        timeout: 10000
      });
      channelData = response.data.items?.[0];
    }

    if (!channelData) {
      throw new Error('Canal de YouTube no encontrado');
    }

    const stats = channelData.statistics;
    const snippet = channelData.snippet;

    return {
      platform: 'youtube',
      username: channelIdentifier,
      channelId: channelData.id,
      channelTitle: snippet.title,
      subscribers: parseInt(stats.subscriberCount) || 0,
      views: parseInt(stats.viewCount) || 0,
      videos: parseInt(stats.videoCount) || 0,
      engagement: calculateYouTubeEngagement(stats),
      description: snippet.description,
      thumbnail: snippet.thumbnails?.high?.url,
      lastUpdate: new Date(),
      success: true
    };
  } catch (error) {
    console.error(`Error fetching YouTube metrics for ${channelIdentifier}:`, error.message);
    return getMockYouTubeData(channelIdentifier);
  }
};

/**
 * Spotify - Using Spotify Web API (no auth for public artist data)
 */
export const fetchSpotifyMetrics = async (artistId) => {
  try {
    // Get Spotify access token (client credentials flow)
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.warn('Spotify credentials not configured, using mock data');
      return getMockSpotifyData(artistId);
    }

    // Get access token
    const authResponse = await axios.post('https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
        }
      }
    );

    const accessToken = authResponse.data.access_token;

    // Get artist data
    const artistResponse = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const artist = artistResponse.data;

    return {
      platform: 'spotify',
      username: artistId,
      artistName: artist.name,
      followers: artist.followers?.total || 0,
      popularity: artist.popularity || 0,
      genres: artist.genres || [],
      imageUrl: artist.images?.[0]?.url,
      spotifyUrl: artist.external_urls?.spotify,
      lastUpdate: new Date(),
      success: true
    };
  } catch (error) {
    console.error(`Error fetching Spotify metrics for ${artistId}:`, error.message);
    return getMockSpotifyData(artistId);
  }
};

/**
 * SoundCloud - Public Profile Scraper
 */
export const fetchSoundCloudMetrics = async (username) => {
  try {
    const url = `https://soundcloud.com/${username}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    // Extract JSON-LD data
    const jsonLd = $('script[type="application/ld+json"]').html();
    let userData = null;

    if (jsonLd) {
      userData = JSON.parse(jsonLd);
    }

    // Also extract from meta tags
    const followers = $('meta[property="soundcloud:follower_count"]').attr('content');
    const tracks = $('meta[property="soundcloud:track_count"]').attr('content');

    return {
      platform: 'soundcloud',
      username: username,
      followers: parseInt(followers) || 0,
      tracks: parseInt(tracks) || 0,
      name: userData?.name || username,
      description: userData?.description,
      lastUpdate: new Date(),
      success: true
    };
  } catch (error) {
    console.error(`Error fetching SoundCloud metrics for ${username}:`, error.message);
    return {
      platform: 'soundcloud',
      username: username,
      error: error.message,
      success: false
    };
  }
};

/**
 * Facebook - Public Page Scraper
 */
export const fetchFacebookMetrics = async (pageName) => {
  try {
    // Note: Facebook has restricted public scraping
    // This will return mock data unless Facebook Graph API is configured
    console.warn('Facebook public scraping is limited, using mock data');
    return getMockFacebookData(pageName);
  } catch (error) {
    console.error(`Error fetching Facebook metrics for ${pageName}:`, error.message);
    return getMockFacebookData(pageName);
  }
};

/**
 * Twitter/X - Public Profile Scraper
 */
export const fetchTwitterMetrics = async (handle) => {
  try {
    // Note: Twitter API requires authentication
    // This will return mock data unless Twitter API credentials are configured
    console.warn('Twitter API requires credentials, using mock data');
    return getMockTwitterData(handle);
  } catch (error) {
    console.error(`Error fetching Twitter metrics for ${handle}:`, error.message);
    return getMockTwitterData(handle);
  }
};

// ============= HELPER FUNCTIONS =============

function calculateInstagramEngagement(userData) {
  try {
    const posts = userData.edge_owner_to_timeline_media?.edges || [];
    if (posts.length === 0) return 0;

    let totalEngagement = 0;
    posts.forEach(post => {
      const likes = post.node.edge_liked_by?.count || 0;
      const comments = post.node.edge_media_to_comment?.count || 0;
      totalEngagement += likes + comments;
    });

    const avgEngagement = totalEngagement / posts.length;
    const followers = userData.edge_followed_by?.count || 1;
    return ((avgEngagement / followers) * 100).toFixed(2);
  } catch (e) {
    return 0;
  }
}

function calculateTikTokEngagement(stats) {
  try {
    const likes = stats.heartCount || 0;
    const videos = stats.videoCount || 1;
    const followers = stats.followerCount || 1;
    const avgLikesPerVideo = likes / videos;
    return ((avgLikesPerVideo / followers) * 100).toFixed(2);
  } catch (e) {
    return 0;
  }
}

function calculateYouTubeEngagement(stats) {
  try {
    const views = parseInt(stats.viewCount) || 0;
    const subscribers = parseInt(stats.subscriberCount) || 1;
    const videos = parseInt(stats.videoCount) || 1;
    const avgViewsPerVideo = views / videos;
    return ((avgViewsPerVideo / subscribers) * 100).toFixed(2);
  } catch (e) {
    return 0;
  }
}

// ============= MOCK DATA FUNCTIONS =============

function getMockYouTubeData(channelIdentifier) {
  return {
    platform: 'youtube',
    username: channelIdentifier,
    subscribers: Math.floor(Math.random() * 50000) + 10000,
    views: Math.floor(Math.random() * 1000000) + 100000,
    videos: Math.floor(Math.random() * 200) + 50,
    engagement: (Math.random() * 5 + 2).toFixed(2),
    lastUpdate: new Date(),
    success: true,
    isMock: true
  };
}

function getMockSpotifyData(artistId) {
  return {
    platform: 'spotify',
    username: artistId,
    followers: Math.floor(Math.random() * 100000) + 10000,
    popularity: Math.floor(Math.random() * 100),
    monthlyListeners: Math.floor(Math.random() * 500000) + 50000,
    lastUpdate: new Date(),
    success: true,
    isMock: true
  };
}

function getMockFacebookData(pageName) {
  return {
    platform: 'facebook',
    username: pageName,
    followers: Math.floor(Math.random() * 50000) + 5000,
    likes: Math.floor(Math.random() * 50000) + 5000,
    engagement: (Math.random() * 5 + 1).toFixed(2),
    lastUpdate: new Date(),
    success: true,
    isMock: true
  };
}

function getMockTwitterData(handle) {
  return {
    platform: 'twitter',
    username: handle,
    followers: Math.floor(Math.random() * 30000) + 5000,
    following: Math.floor(Math.random() * 2000) + 100,
    tweets: Math.floor(Math.random() * 5000) + 500,
    engagement: (Math.random() * 3 + 1).toFixed(2),
    lastUpdate: new Date(),
    success: true,
    isMock: true
  };
}

/**
 * Main function to fetch all metrics for a DJ
 *
 * @param {Array} socialAccounts - Array of social media accounts
 * @param {number} djId - DJ ID for cache lookup (optional)
 * @param {object} options - Scraping options (optional)
 */
export const fetchAllMetricsForDJ = async (socialAccounts, djId = null, options = {}) => {
  const results = {};

  for (const account of socialAccounts) {
    const { platform, platform_username } = account;
    // Use account.dj_id if available, otherwise use provided djId
    const accountDjId = account.dj_id || djId;

    try {
      switch (platform) {
        case 'instagram':
          results[platform] = await fetchInstagramMetrics(platform_username, null, accountDjId, options);
          break;
        case 'tiktok':
          results[platform] = await fetchTikTokMetrics(platform_username);
          break;
        case 'youtube':
          results[platform] = await fetchYouTubeMetrics(platform_username);
          break;
        case 'spotify':
          results[platform] = await fetchSpotifyMetrics(platform_username);
          break;
        case 'soundcloud':
          results[platform] = await fetchSoundCloudMetrics(platform_username);
          break;
        case 'facebook':
          results[platform] = await fetchFacebookMetrics(platform_username);
          break;
        case 'twitter':
          results[platform] = await fetchTwitterMetrics(platform_username);
          break;
        default:
          results[platform] = { success: false, error: 'Platform not supported' };
      }
    } catch (error) {
      results[platform] = { success: false, error: error.message };
    }
  }

  return results;
};

export default {
  fetchInstagramMetrics,
  fetchTikTokMetrics,
  fetchYouTubeMetrics,
  fetchSpotifyMetrics,
  fetchSoundCloudMetrics,
  fetchFacebookMetrics,
  fetchTwitterMetrics,
  fetchAllMetricsForDJ
};
