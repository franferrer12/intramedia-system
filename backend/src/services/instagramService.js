import axios from 'axios';
import * as cheerio from 'cheerio';
import { scrapeInstagramProfile } from './advancedInstagramScraper.js';
import { getCachedInstagramData, isCacheFresh } from './instagramCacheService.js';
import { queueInstagramScrape } from './instagramQueueService.js';

/**
 * Instagram Service - Servicio especializado para Instagram
 *
 * Arquitectura de 3 capas:
 * 1. Cache Layer → Retorna datos cacheados si están frescos (< 24h)
 * 2. Advanced Scraper → Playwright + múltiples fallbacks
 * 3. Queue System → Procesamiento en background para actualizaciones
 *
 * Métodos legacy (mantenidos para compatibilidad):
 * - Instagram Graph API (oficial para Business/Creator accounts)
 * - Scraping público (para cuentas personales)
 */

/**
 * MÉTODO 1: Instagram Graph API (Oficial)
 * Requiere: Access Token de una cuenta Business/Creator
 * Documentación: https://developers.facebook.com/docs/instagram-api
 */
export const fetchInstagramDataGraphAPI = async (username, accessToken) => {
  try {
    console.log(`📸 [Instagram Graph API] Fetching data for @${username}...`);

    // Obtener Instagram Business Account ID
    const accountResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token: accessToken,
        fields: 'instagram_business_account'
      }
    });

    const igBusinessAccountId = accountResponse.data.data[0]?.instagram_business_account?.id;

    if (!igBusinessAccountId) {
      throw new Error('No se encontró cuenta de Instagram Business vinculada');
    }

    // Obtener métricas del perfil
    const metricsResponse = await axios.get(`https://graph.facebook.com/v18.0/${igBusinessAccountId}`, {
      params: {
        access_token: accessToken,
        fields: 'username,name,biography,website,followers_count,follows_count,media_count,profile_picture_url'
      }
    });

    const profile = metricsResponse.data;

    // Obtener insights del perfil (últimos 30 días)
    const insightsResponse = await axios.get(`https://graph.facebook.com/v18.0/${igBusinessAccountId}/insights`, {
      params: {
        access_token: accessToken,
        metric: 'impressions,reach,profile_views,follower_count',
        period: 'day',
        since: Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60), // 30 días atrás
        until: Math.floor(Date.now() / 1000)
      }
    });

    const insights = insightsResponse.data.data;

    // Obtener últimos posts
    const mediaResponse = await axios.get(`https://graph.facebook.com/v18.0/${igBusinessAccountId}/media`, {
      params: {
        access_token: accessToken,
        fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count,insights.metric(impressions,reach,engagement)',
        limit: 25
      }
    });

    const posts = mediaResponse.data.data;

    // Calcular engagement rate
    const totalEngagement = posts.reduce((sum, post) => {
      return sum + (post.like_count || 0) + (post.comments_count || 0);
    }, 0);
    const avgEngagement = posts.length > 0 ? totalEngagement / posts.length : 0;
    const engagementRate = profile.followers_count > 0
      ? ((avgEngagement / profile.followers_count) * 100).toFixed(2)
      : 0;

    // Encontrar top post
    const topPost = posts.reduce((best, post) => {
      const engagement = (post.like_count || 0) + (post.comments_count || 0);
      const bestEngagement = (best.like_count || 0) + (best.comments_count || 0);
      return engagement > bestEngagement ? post : best;
    }, posts[0] || {});

    // Calcular métricas de insights
    const impressionsData = insights.find(i => i.name === 'impressions')?.values || [];
    const reachData = insights.find(i => i.name === 'reach')?.values || [];
    const profileViewsData = insights.find(i => i.name === 'profile_views')?.values || [];

    const totalImpressions = impressionsData.reduce((sum, day) => sum + day.value, 0);
    const totalReach = reachData.reduce((sum, day) => sum + day.value, 0);
    const totalProfileViews = profileViewsData.reduce((sum, day) => sum + day.value, 0);

    // Calcular crecimiento de followers (últimos 7 días vs anteriores 7 días)
    const followerGrowth = calculateFollowerGrowth(insights);

    return {
      success: true,
      method: 'graph_api',
      username: profile.username,
      profile: {
        name: profile.name,
        username: profile.username,
        biography: profile.biography,
        website: profile.website,
        profile_picture_url: profile.profile_picture_url,
        is_verified: profile.is_verified || false,
        is_business: true
      },
      metrics: {
        followers: profile.followers_count,
        following: profile.follows_count,
        posts: profile.media_count,
        engagement_rate: parseFloat(engagementRate),
        avg_likes: Math.round(totalEngagement / posts.length),
        impressions: totalImpressions,
        reach: totalReach,
        profile_views: totalProfileViews
      },
      growth: followerGrowth,
      recent_posts: posts.slice(0, 12).map(post => ({
        id: post.id,
        caption: post.caption?.substring(0, 100),
        media_type: post.media_type,
        media_url: post.media_url,
        permalink: post.permalink,
        timestamp: post.timestamp,
        likes: post.like_count,
        comments: post.comments_count,
        engagement: (post.like_count || 0) + (post.comments_count || 0),
        impressions: post.insights?.data?.find(i => i.name === 'impressions')?.values[0]?.value || 0,
        reach: post.insights?.data?.find(i => i.name === 'reach')?.values[0]?.value || 0
      })),
      top_post: {
        id: topPost.id,
        caption: topPost.caption?.substring(0, 100),
        permalink: topPost.permalink,
        likes: topPost.like_count,
        comments: topPost.comments_count,
        engagement: (topPost.like_count || 0) + (topPost.comments_count || 0)
      },
      insights_period: '30_days',
      last_update: new Date().toISOString()
    };

  } catch (error) {
    console.error(`❌ [Instagram Graph API] Error for @${username}:`, error.message);
    throw new Error(`Graph API error: ${error.message}`);
  }
};

/**
 * MÉTODO 2: Scraping de datos públicos
 * No requiere autenticación, pero más limitado
 */
export const fetchInstagramDataPublic = async (username) => {
  try {
    console.log(`📸 [Instagram Public] Scraping data for @${username}...`);

    // Método 1: Intentar obtener JSON embedded
    const url = `https://www.instagram.com/${username}/`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      },
      timeout: 15000
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Buscar el script con datos JSON
    let userData = null;

    $('script[type="application/ld+json"]').each((i, elem) => {
      try {
        const data = JSON.parse($(elem).html());
        if (data['@type'] === 'ProfilePage') {
          userData = data;
        }
      } catch (e) {
        // Continue
      }
    });

    // Método alternativo: buscar en window._sharedData
    if (!userData) {
      const scriptMatch = html.match(/window\._sharedData\s*=\s*({.+?});/);
      if (scriptMatch) {
        try {
          const sharedData = JSON.parse(scriptMatch[1]);
          const user = sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user;
          if (user) {
            return parseInstagramUserData(user);
          }
        } catch (e) {
          console.error('Error parsing _sharedData:', e.message);
        }
      }
    }

    // Método 3: Buscar meta tags
    if (!userData) {
      return scrapeInstagramMetaTags($, username);
    }

    // Parsear datos encontrados
    const description = userData.description || '';
    const followersMatch = description.match(/(\d+(?:,\d+)*)\s*Followers/i);
    const followingMatch = description.match(/(\d+(?:,\d+)*)\s*Following/i);
    const postsMatch = description.match(/(\d+(?:,\d+)*)\s*Posts/i);

    return {
      success: true,
      method: 'public_scraping',
      username: username,
      profile: {
        name: userData.name || username,
        username: username,
        biography: userData.description || '',
        profile_picture_url: userData.image || ''
      },
      metrics: {
        followers: followersMatch ? parseInt(followersMatch[1].replace(/,/g, '')) : 0,
        following: followingMatch ? parseInt(followingMatch[1].replace(/,/g, '')) : 0,
        posts: postsMatch ? parseInt(postsMatch[1].replace(/,/g, '')) : 0,
        engagement_rate: 0 // No disponible públicamente
      },
      last_update: new Date().toISOString()
    };

  } catch (error) {
    console.error(`❌ [Instagram Public] Error for @${username}:`, error.message);
    throw error;
  }
};

/**
 * Parsear datos de usuario de Instagram desde GraphQL
 */
function parseInstagramUserData(user) {
  const recentPosts = user.edge_owner_to_timeline_media?.edges?.slice(0, 12) || [];

  // Calcular engagement
  let totalEngagement = 0;
  recentPosts.forEach(edge => {
    totalEngagement += (edge.node.edge_liked_by?.count || 0) + (edge.node.edge_media_to_comment?.count || 0);
  });

  const avgEngagement = recentPosts.length > 0 ? totalEngagement / recentPosts.length : 0;
  const engagementRate = user.edge_followed_by?.count > 0
    ? ((avgEngagement / user.edge_followed_by.count) * 100).toFixed(2)
    : 0;

  // Top post
  const topPost = recentPosts.reduce((best, edge) => {
    const engagement = (edge.node.edge_liked_by?.count || 0) + (edge.node.edge_media_to_comment?.count || 0);
    const bestEngagement = (best?.node?.edge_liked_by?.count || 0) + (best?.node?.edge_media_to_comment?.count || 0);
    return engagement > bestEngagement ? edge : best;
  }, recentPosts[0]);

  return {
    success: true,
    method: 'public_graphql',
    username: user.username,
    profile: {
      name: user.full_name,
      username: user.username,
      biography: user.biography,
      website: user.external_url,
      profile_picture_url: user.profile_pic_url_hd || user.profile_pic_url,
      is_verified: user.is_verified,
      is_business: user.is_business_account,
      is_private: user.is_private
    },
    metrics: {
      followers: user.edge_followed_by?.count || 0,
      following: user.edge_follow?.count || 0,
      posts: user.edge_owner_to_timeline_media?.count || 0,
      engagement_rate: parseFloat(engagementRate),
      avg_likes: Math.round(avgEngagement)
    },
    recent_posts: recentPosts.map(edge => ({
      id: edge.node.id,
      caption: edge.node.edge_media_to_caption?.edges[0]?.node?.text?.substring(0, 100),
      media_type: edge.node.__typename,
      thumbnail_url: edge.node.thumbnail_src || edge.node.display_url,
      shortcode: edge.node.shortcode,
      timestamp: new Date(edge.node.taken_at_timestamp * 1000).toISOString(),
      likes: edge.node.edge_liked_by?.count || 0,
      comments: edge.node.edge_media_to_comment?.count || 0,
      engagement: (edge.node.edge_liked_by?.count || 0) + (edge.node.edge_media_to_comment?.count || 0)
    })),
    top_post: topPost ? {
      shortcode: topPost.node.shortcode,
      caption: topPost.node.edge_media_to_caption?.edges[0]?.node?.text?.substring(0, 100),
      likes: topPost.node.edge_liked_by?.count || 0,
      comments: topPost.node.edge_media_to_comment?.count || 0,
      thumbnail_url: topPost.node.thumbnail_src || topPost.node.display_url
    } : null,
    last_update: new Date().toISOString()
  };
}

/**
 * Scraping de meta tags como último recurso
 */
function scrapeInstagramMetaTags($, username) {
  const followers = $('meta[property="og:description"]').attr('content');
  const followersMatch = followers?.match(/(\d+(?:,\d+)?[KkMm]?)\s*Followers/i);

  return {
    success: true,
    method: 'meta_tags',
    username: username,
    profile: {
      name: $('meta[property="og:title"]').attr('content') || username,
      username: username,
      profile_picture_url: $('meta[property="og:image"]').attr('content') || ''
    },
    metrics: {
      followers: parseFollowerCount(followersMatch?.[1] || '0'),
      following: 0,
      posts: 0,
      engagement_rate: 0
    },
    last_update: new Date().toISOString()
  };
}

/**
 * Parsear conteo de followers (maneja K, M, etc)
 */
function parseFollowerCount(countStr) {
  if (!countStr) return 0;

  countStr = countStr.toUpperCase().replace(/,/g, '');

  if (countStr.includes('M')) {
    return Math.round(parseFloat(countStr) * 1000000);
  } else if (countStr.includes('K')) {
    return Math.round(parseFloat(countStr) * 1000);
  }

  return parseInt(countStr) || 0;
}

/**
 * Calcular crecimiento de followers
 */
function calculateFollowerGrowth(insights) {
  const followerData = insights.find(i => i.name === 'follower_count')?.values || [];

  if (followerData.length < 14) {
    return { change: 0, percentage: 0 };
  }

  const recent7Days = followerData.slice(-7);
  const previous7Days = followerData.slice(-14, -7);

  const avgRecent = recent7Days.reduce((sum, day) => sum + day.value, 0) / 7;
  const avgPrevious = previous7Days.reduce((sum, day) => sum + day.value, 0) / 7;

  const change = avgRecent - avgPrevious;
  const percentage = avgPrevious > 0 ? ((change / avgPrevious) * 100).toFixed(2) : 0;

  return { change: Math.round(change), percentage: parseFloat(percentage) };
}

/**
 * Función principal con arquitectura de 3 capas
 *
 * @param {string} username - Instagram username
 * @param {string|null} accessToken - Optional Graph API token
 * @param {number|null} djId - DJ ID for cache lookup
 * @param {object} options - Options for scraping
 * @returns {Promise<object>} Instagram data
 */
export const fetchInstagramData = async (username, accessToken = null, djId = null, options = {}) => {
  console.log(`\n📸 [Instagram Service] Fetching data for @${username}...`);

  // LAYER 1: Check cache first (if djId provided)
  if (djId && !options.forceRefresh) {
    console.log('🔍 [Layer 1] Checking cache...');

    const cachedData = await getCachedInstagramData(djId, username);
    if (cachedData && cachedData.success) {
      console.log(`✅ [Cache Hit] Returning cached data (${cachedData.cache_age_hours}h old)`);
      return cachedData;
    }

    console.log('❌ [Cache Miss] Cache expired or not found');
  }

  // LAYER 2: Try Graph API if token provided
  if (accessToken && !options.skipGraphAPI) {
    try {
      console.log('🔍 [Layer 2] Trying Graph API...');
      const data = await fetchInstagramDataGraphAPI(username, accessToken);
      console.log('✅ [Graph API] Success');
      return data;
    } catch (error) {
      console.log('⚠️  [Graph API] Failed, falling back to scraper...');
    }
  }

  // LAYER 3: Use Advanced Scraper with multiple fallbacks
  console.log('🔍 [Layer 3] Using Advanced Scraper...');

  try {
    const data = await scrapeInstagramProfile(username, {
      skipPlaywright: options.skipPlaywright || false,
      useMock: options.useMock || false,
      maxRetries: options.maxRetries || 2
    });

    console.log(`✅ [Advanced Scraper] Success using ${data.method}`);

    // Ensure arrays exist even if empty
    if (!data.recent_posts) {
      data.recent_posts = [];
    }
    if (!data.top_post) {
      data.top_post = null;
    }

    return data;

  } catch (error) {
    console.error('❌ [Advanced Scraper] All methods failed:', error.message);
    throw new Error(`Failed to fetch Instagram data: ${error.message}`);
  }
};

/**
 * Fetch and queue for background processing
 * Returns cached data immediately, queues scraping job for later
 */
export const fetchInstagramDataWithQueue = async (username, djId, options = {}) => {
  console.log(`\n📸 [Instagram Service] Fetch with queue for @${username}...`);

  // Check cache first
  const cachedData = await getCachedInstagramData(djId, username);

  if (cachedData && cachedData.success && !options.forceRefresh) {
    console.log(`✅ [Cache Hit] Returning cached data immediately`);

    // If cache is getting old (> 12 hours), queue a background refresh
    const cacheAgeHours = parseFloat(cachedData.cache_age_hours);
    if (cacheAgeHours > 12) {
      console.log(`🔄 [Background Refresh] Cache is ${cacheAgeHours}h old, queuing refresh...`);
      await queueInstagramScrape(djId, username, { priority: 5 });
    }

    return {
      ...cachedData,
      queued: false
    };
  }

  // No cache or expired - queue scraping job and throw error
  console.log('📝 [Queue] No fresh cache, queuing immediate scrape...');
  await queueInstagramScrape(djId, username, { priority: 1 });

  throw new Error('No cached data available. Instagram data is being fetched. Please refresh in a few moments.');
};

export default {
  fetchInstagramData,
  fetchInstagramDataWithQueue,
  fetchInstagramDataGraphAPI,
  fetchInstagramDataPublic
};
