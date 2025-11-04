#!/usr/bin/env node

/**
 * Test script to fetch Instagram data and check if we get posts
 */

import { scrapeInstagramProfile } from './src/services/advancedInstagramScraper.js';

const username = process.argv[2] || 'intra.media';

console.log(`\n🔍 Testing Instagram scraper for @${username}...\n`);

try {
  const result = await scrapeInstagramProfile(username, {
    skipPlaywright: false, // Try Playwright first
    useMock: false,
    maxRetries: 1
  });

  console.log('\n✅ Results:');
  console.log('━'.repeat(60));
  console.log(`📊 Method used: ${result.method}`);
  console.log(`👤 Username: ${result.profile.username}`);
  console.log(`📸 Profile pic: ${result.profile.profile_picture_url ? 'Yes' : 'No'}`);
  console.log(`\n📈 Metrics:`);
  console.log(`   Followers: ${result.metrics.followers.toLocaleString()}`);
  console.log(`   Following: ${result.metrics.following.toLocaleString()}`);
  console.log(`   Posts: ${result.metrics.posts.toLocaleString()}`);
  console.log(`   Engagement: ${result.metrics.engagement_rate}%`);
  console.log(`   Avg Likes: ${result.metrics.avg_likes.toLocaleString()}`);

  console.log(`\n📸 Recent Posts: ${result.recent_posts.length}`);
  if (result.recent_posts.length > 0) {
    console.log('\nSample posts:');
    result.recent_posts.slice(0, 3).forEach((post, i) => {
      console.log(`\n   ${i + 1}. Post ${post.shortcode}`);
      console.log(`      ❤️  ${post.likes.toLocaleString()} likes`);
      console.log(`      💬 ${post.comments.toLocaleString()} comments`);
      console.log(`      📝 "${post.caption.substring(0, 50)}..."`);
    });
  } else {
    console.log('   ⚠️  No posts found - only basic profile data available');
  }

  if (result.top_post) {
    console.log(`\n🏆 Top Post:`);
    console.log(`   ❤️  ${result.top_post.likes.toLocaleString()} likes`);
    console.log(`   💬 ${result.top_post.comments.toLocaleString()} comments`);
  }

  console.log('\n━'.repeat(60));
  console.log(`\n${result.recent_posts.length > 0 ? '✅ SUCCESS' : '⚠️  LIMITED DATA'}: Scraping completed`);

  if (result.recent_posts.length === 0) {
    console.log('\n💡 Note: Instagram is blocking detailed data access.');
    console.log('   The system will use cached data or fallback to demo data.');
  }

} catch (error) {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
}
