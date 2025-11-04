import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Apply stealth plugin to avoid detection
chromium.use(StealthPlugin());

/**
 * Advanced Instagram Scraper - Professional Grade
 *
 * Features:
 * - Playwright browser automation with anti-detection
 * - 4 fallback methods for maximum reliability
 * - Rate limiting and request throttling
 * - User-agent rotation
 * - Error recovery and retries
 * - Detailed logging
 */

// Rate limiting: Track last request time per username
const requestTimestamps = new Map();
const MIN_REQUEST_INTERVAL = 10000; // 10 seconds between requests for same username

// User agents pool for rotation
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

/**
 * Get random user agent
 */
function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Random delay to avoid detection
 */
function randomDelay(min = 2000, max = 5000) {
  return new Promise(resolve => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    setTimeout(resolve, delay);
  });
}

/**
 * Check and enforce rate limiting
 */
function checkRateLimit(username) {
  const now = Date.now();
  const lastRequest = requestTimestamps.get(username);

  if (lastRequest) {
    const timeSinceLastRequest = now - lastRequest;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      console.log(`⏰ [Rate Limit] Waiting ${(waitTime / 1000).toFixed(1)}s for @${username}...`);
      return new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  requestTimestamps.set(username, now);
  return Promise.resolve();
}

/**
 * METHOD 1: Playwright Browser Automation (Most Reliable)
 * Simulates real browser behavior to avoid detection
 */
export async function scrapeWithPlaywright(username) {
  let browser = null;

  try {
    console.log(`🎭 [Playwright] Launching browser for @${username}...`);

    // Launch headless browser with stealth settings
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const context = await browser.newContext({
      userAgent: getRandomUserAgent(),
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'America/New_York'
    });

    const page = await context.newPage();

    // Set extra headers to look more like a real browser
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    });

    // Navigate to profile
    console.log(`🌐 [Playwright] Navigating to instagram.com/${username}...`);
    const response = await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    if (!response || response.status() === 404) {
      throw new Error('Profile not found');
    }

    // Random delay to mimic human behavior
    await randomDelay(2000, 4000);

    // Scroll down to load posts
    console.log('📜 [Playwright] Scrolling to load posts...');
    await page.evaluate(() => {
      window.scrollBy(0, 1000);
    });
    await randomDelay(3000, 4000); // Increased wait time for images to load

    // Extract data from page - IMPROVED VERSION
    console.log('🔍 [Playwright] Extracting data from page...');
    const data = await page.evaluate(() => {
      try {
        // METHOD 1: Try window._sharedData (legacy but sometimes works)
        if (window._sharedData) {
          const user = window._sharedData.entry_data?.ProfilePage?.[0]?.graphql?.user;
          if (user) {
            console.log('[Scraper] Found data in window._sharedData');
            return { source: 'sharedData', data: user };
          }
        }

        // METHOD 2: Try window.__additionalDataLoaded (newer Instagram method)
        if (window.__additionalDataLoaded) {
          console.log('[Scraper] Checking window.__additionalDataLoaded...');
          for (const key in window.__additionalDataLoaded) {
            try {
              const data = window.__additionalDataLoaded[key];
              if (data?.graphql?.user) {
                console.log('[Scraper] Found data in __additionalDataLoaded');
                return { source: 'sharedData', data: data.graphql.user };
              }
            } catch (e) {
              continue;
            }
          }
        }

        // METHOD 3: Search ALL script tags for embedded JSON
        console.log('[Scraper] Searching all script tags for JSON data...');
        const allScripts = document.querySelectorAll('script');
        for (const script of allScripts) {
          const content = script.textContent || script.innerText;

          // Look for ProfilePage JSON-LD
          if (script.type === 'application/ld+json') {
            try {
              const json = JSON.parse(content);
              if (json['@type'] === 'ProfilePage') {
                console.log('[Scraper] Found ProfilePage in ld+json');
                return { source: 'ld+json', data: json };
              }
            } catch (e) {
              continue;
            }
          }

          // Look for JavaScript variable assignments with user data
          if (!script.type || script.type === 'text/javascript') {
            // Try to find patterns like: require("X").handle({"user":...})
            const requireMatch = content.match(/require\([^)]+\)\.handle\(({.+?})\)/);
            if (requireMatch) {
              try {
                const json = JSON.parse(requireMatch[1]);
                if (json?.user || json?.graphql?.user) {
                  console.log('[Scraper] Found data in require().handle()');
                  return { source: 'sharedData', data: json.user || json.graphql.user };
                }
              } catch (e) {
                continue;
              }
            }

            // Try to find patterns like: {"entry_data":{"ProfilePage":[...]}}
            const profilePageMatch = content.match(/"ProfilePage":\s*\[({[^]]+?})\]/);
            if (profilePageMatch) {
              try {
                const json = JSON.parse(profilePageMatch[1]);
                if (json?.graphql?.user) {
                  console.log('[Scraper] Found ProfilePage data in script');
                  return { source: 'sharedData', data: json.graphql.user };
                }
              } catch (e) {
                continue;
              }
            }
          }
        }

        // METHOD 4: Try to extract post images from DOM directly
        console.log('[Scraper] Attempting to extract posts from DOM...');

        // Try multiple selectors for Instagram posts
        let images = [];

        // Selector 1: Try article images
        images = Array.from(document.querySelectorAll('article img'));

        // Selector 2: Try div images within main
        if (images.length === 0) {
          images = Array.from(document.querySelectorAll('main img'));
        }

        // Selector 3: Try all images with Instagram CDN URLs
        if (images.length === 0) {
          images = Array.from(document.querySelectorAll('img')).filter(img => {
            const src = img.src || img.getAttribute('data-src') || '';
            return src.includes('cdninstagram.com') && !src.includes('profile_pic');
          });
        }

        const domPosts = [];

        if (images.length > 0) {
          console.log(`[Scraper] Found ${images.length} images in DOM`);
          images.forEach((img, idx) => {
            if (idx < 12) { // Max 12 posts
              const src = img.src || img.getAttribute('data-src') || img.getAttribute('srcset')?.split(' ')[0];
              if (src && !src.includes('profile_pic') && !src.includes('avatar')) {
                domPosts.push({
                  thumbnail_url: src,
                  index: idx
                });
              }
            }
          });
        }

        // Fallback to meta tags with DOM posts if available
        const metaDescription = document.querySelector('meta[property="og:description"]')?.content || '';
        const metaTitle = document.querySelector('meta[property="og:title"]')?.content || '';
        const metaImage = document.querySelector('meta[property="og:image"]')?.content || '';

        console.log('[Scraper] Falling back to meta tags');
        return {
          source: 'meta',
          data: {
            description: metaDescription,
            title: metaTitle,
            image: metaImage,
            domPosts: domPosts
          }
        };
      } catch (error) {
        return { source: 'error', error: error.message };
      }
    });

    await browser.close();
    browser = null;

    if (data.source === 'error') {
      throw new Error(`Browser extraction failed: ${data.error}`);
    }

    console.log(`✅ [Playwright] Data extracted successfully from ${data.source}`);

    // Log what we found
    if (data.source === 'meta' && data.data.domPosts) {
      console.log(`📸 [Playwright] Found ${data.data.domPosts.length} post images in DOM`);
    } else if (data.source === 'sharedData') {
      console.log(`📸 [Playwright] Found sharedData with user object`);
    } else if (data.source === 'ld+json') {
      console.log(`📸 [Playwright] Found ld+json schema data`);
    }

    return parseInstagramData(data.data, data.source, username);

  } catch (error) {
    console.error(`❌ [Playwright] Error for @${username}:`, error.message);
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

/**
 * METHOD 2: Direct HTTP Request with Embedded JSON Extraction
 * Faster than Playwright, works if Instagram doesn't block the request
 */
export async function scrapeWithAxios(username) {
  try {
    console.log(`🌐 [Axios] Fetching instagram.com/${username}...`);

    const response = await axios.get(`https://www.instagram.com/${username}/`, {
      headers: {
        'User-Agent': getRandomUserAgent(),
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
      timeout: 15000,
      maxRedirects: 5
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Try JSON-LD
    let userData = null;
    $('script[type="application/ld+json"]').each((i, elem) => {
      try {
        const data = JSON.parse($(elem).html());
        if (data['@type'] === 'ProfilePage') {
          userData = { source: 'ld+json', data };
          return false; // break
        }
      } catch (e) {
        // Continue
      }
    });

    // Try window._sharedData
    if (!userData) {
      const scriptMatch = html.match(/window\._sharedData\s*=\s*({.+?});/);
      if (scriptMatch) {
        try {
          const sharedData = JSON.parse(scriptMatch[1]);
          const user = sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user;
          if (user) {
            userData = { source: 'sharedData', data: user };
          }
        } catch (e) {
          console.error('Error parsing _sharedData:', e.message);
        }
      }
    }

    // Fallback to meta tags
    if (!userData) {
      const description = $('meta[property="og:description"]').attr('content') || '';
      const title = $('meta[property="og:title"]').attr('content') || '';
      const image = $('meta[property="og:image"]').attr('content') || '';

      userData = {
        source: 'meta',
        data: { description, title, image }
      };
    }

    console.log(`✅ [Axios] Data extracted successfully from ${userData.source}`);
    return parseInstagramData(userData.data, userData.source, username);

  } catch (error) {
    console.error(`❌ [Axios] Error for @${username}:`, error.message);
    throw error;
  }
}

/**
 * METHOD 3: Cheerio HTML Parsing (Meta Tags)
 * Last resort before mock data
 */
export async function scrapeMetaTags(username) {
  try {
    console.log(`🏷️  [Meta Tags] Fetching basic info for @${username}...`);

    const response = await axios.get(`https://www.instagram.com/${username}/`, {
      headers: {
        'User-Agent': getRandomUserAgent()
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    const description = $('meta[property="og:description"]').attr('content') || '';
    const title = $('meta[property="og:title"]').attr('content') || '';
    const image = $('meta[property="og:image"]').attr('content') || '';

    return parseInstagramData({ description, title, image }, 'meta', username);

  } catch (error) {
    console.error(`❌ [Meta Tags] Error for @${username}:`, error.message);
    throw error;
  }
}

/**
 * Parse Instagram data based on source type
 */
function parseInstagramData(data, source, username) {
  const result = {
    success: true,
    method: source,
    username: username,
    profile: {},
    metrics: {},
    recent_posts: [],
    top_post: null,
    last_update: new Date().toISOString()
  };

  try {
    if (source === 'sharedData') {
      // Full GraphQL data available
      result.profile = {
        name: data.full_name || username,
        username: data.username || username,
        biography: data.biography || '',
        website: data.external_url || null,
        profile_picture_url: data.profile_pic_url_hd || data.profile_pic_url || '',
        is_verified: data.is_verified || false,
        is_business: data.is_business_account || false,
        is_private: data.is_private || false
      };

      result.metrics = {
        followers: data.edge_followed_by?.count || 0,
        following: data.edge_follow?.count || 0,
        posts: data.edge_owner_to_timeline_media?.count || 0,
        engagement_rate: 0,
        avg_likes: 0
      };

      // Process posts
      const posts = data.edge_owner_to_timeline_media?.edges || [];
      if (posts.length > 0) {
        let totalEngagement = 0;

        result.recent_posts = posts.slice(0, 12).map(edge => {
          const likes = edge.node.edge_liked_by?.count || 0;
          const comments = edge.node.edge_media_to_comment?.count || 0;
          const engagement = likes + comments;
          totalEngagement += engagement;

          return {
            id: edge.node.id,
            shortcode: edge.node.shortcode,
            caption: edge.node.edge_media_to_caption?.edges[0]?.node?.text?.substring(0, 100) || '',
            media_type: edge.node.__typename,
            thumbnail_url: edge.node.thumbnail_src || edge.node.display_url,
            timestamp: new Date(edge.node.taken_at_timestamp * 1000).toISOString(),
            likes,
            comments,
            engagement
          };
        });

        // Calculate engagement rate
        const avgEngagement = totalEngagement / posts.length;
        result.metrics.avg_likes = Math.round(avgEngagement);

        if (result.metrics.followers > 0) {
          result.metrics.engagement_rate = parseFloat(
            ((avgEngagement / result.metrics.followers) * 100).toFixed(2)
          );
        }

        // Find top post
        const topPostEdge = posts.reduce((best, edge) => {
          const engagement = (edge.node.edge_liked_by?.count || 0) +
                           (edge.node.edge_media_to_comment?.count || 0);
          const bestEngagement = (best.node.edge_liked_by?.count || 0) +
                                (best.node.edge_media_to_comment?.count || 0);
          return engagement > bestEngagement ? edge : best;
        }, posts[0]);

        if (topPostEdge) {
          result.top_post = {
            shortcode: topPostEdge.node.shortcode,
            caption: topPostEdge.node.edge_media_to_caption?.edges[0]?.node?.text?.substring(0, 100) || '',
            thumbnail_url: topPostEdge.node.thumbnail_src || topPostEdge.node.display_url,
            likes: topPostEdge.node.edge_liked_by?.count || 0,
            comments: topPostEdge.node.edge_media_to_comment?.count || 0
          };
        }
      }

    } else if (source === 'ld+json') {
      // JSON-LD schema data
      result.profile = {
        name: data.name || username,
        username: username,
        biography: data.description || '',
        profile_picture_url: data.image || '',
        is_verified: false,
        is_business: false,
        is_private: false
      };

      // Extract metrics from description
      const description = data.description || '';
      const followersMatch = description.match(/([\d,]+)\s*Followers/i);
      const followingMatch = description.match(/([\d,]+)\s*Following/i);
      const postsMatch = description.match(/([\d,]+)\s*Posts/i);

      result.metrics = {
        followers: followersMatch ? parseInt(followersMatch[1].replace(/,/g, '')) : 0,
        following: followingMatch ? parseInt(followingMatch[1].replace(/,/g, '')) : 0,
        posts: postsMatch ? parseInt(postsMatch[1].replace(/,/g, '')) : 0,
        engagement_rate: 0,
        avg_likes: 0
      };

    } else if (source === 'meta') {
      // Meta tags only (limited data)
      result.profile = {
        name: data.title || username,
        username: username,
        biography: '',
        profile_picture_url: data.image || '',
        is_verified: false,
        is_business: false,
        is_private: false
      };

      const description = data.description || '';
      const followersMatch = description.match(/([\d,KkMm.]+)\s*Followers/i);
      const followingMatch = description.match(/([\d,KkMm.]+)\s*Following/i);
      const postsMatch = description.match(/([\d,KkMm.]+)\s*Posts/i);

      result.metrics = {
        followers: parseCount(followersMatch?.[1] || '0'),
        following: parseCount(followingMatch?.[1] || '0'),
        posts: parseCount(postsMatch?.[1] || '0'),
        engagement_rate: 0,
        avg_likes: 0
      };

      // DOM posts without engagement data are not useful
      // We only want REAL data with actual engagement metrics
      // If domPosts exist but without engagement, just ignore them
      if (data.domPosts && data.domPosts.length > 0) {
        console.log(`⚠️  [DOM Extraction] Found ${data.domPosts.length} post images, but no engagement data available. Skipping.`);
      }
    }

    return result;

  } catch (error) {
    console.error(`Error parsing data for @${username}:`, error.message);
    throw error;
  }
}

/**
 * Parse count with K/M suffixes
 */
function parseCount(countStr) {
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
 * NO MOCK DATA - Real data only
 * This function has been removed to ensure 100% real data
 */

/**
 * Main scraping function with cascading fallbacks
 */
export async function scrapeInstagramProfile(username, options = {}) {
  const {
    skipPlaywright = false,
    maxRetries = 2
  } = options;

  console.log(`\n📸 [Instagram Scraper] Starting scrape for @${username}...`);
  console.log(`⚙️  Options: skipPlaywright=${skipPlaywright}, retries=${maxRetries}`);

  // Enforce rate limiting
  await checkRateLimit(username);

  const methods = [
    { name: 'Axios (Fast)', fn: () => scrapeWithAxios(username) },
  ];

  // Add Playwright as first method if not skipped
  if (!skipPlaywright) {
    methods.unshift({ name: 'Playwright (Reliable)', fn: () => scrapeWithPlaywright(username) });
  }

  methods.push({ name: 'Meta Tags (Basic)', fn: () => scrapeMetaTags(username) });

  // Try each method with retries
  for (const method of methods) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 [Attempt ${attempt}/${maxRetries}] Trying ${method.name}...`);

        const result = await method.fn();

        if (result && result.success) {
          console.log(`✅ [SUCCESS] Data obtained using ${method.name}`);
          console.log(`📊 Metrics: ${result.metrics.followers} followers, ${result.metrics.posts} posts`);
          return result;
        }
      } catch (error) {
        console.error(`❌ [${method.name}] Attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          const waitTime = attempt * 2000; // Exponential backoff
          console.log(`⏳ Waiting ${waitTime / 1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
  }

  // All methods failed - NO MOCK DATA
  const error = new Error(`No se pudo obtener datos de Instagram para @${username}. Todos los métodos fallaron.`);
  console.error(`❌ [FINAL ERROR] ${error.message}`);
  throw error;
}

export default {
  scrapeInstagramProfile,
  scrapeWithPlaywright,
  scrapeWithAxios,
  scrapeMetaTags
};
