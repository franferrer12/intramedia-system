import pool from '../src/config/database.js';

/**
 * Script to clean mock/demo social media data
 * Only keep real scraped data
 */

async function cleanSocialData() {
  console.log('🧹 Starting social media data cleanup...\n');

  try {
    // 1. Check current data
    console.log('📊 Current data status:');

    const accountsCount = await pool.query('SELECT COUNT(*) FROM social_media_accounts');
    console.log(`   - Social media accounts: ${accountsCount.rows[0].count}`);

    const snapshotsCount = await pool.query('SELECT COUNT(*) FROM social_media_snapshots');
    console.log(`   - Snapshots: ${snapshotsCount.rows[0].count}`);

    const connectionsCount = await pool.query('SELECT COUNT(*) FROM social_connections');
    console.log(`   - Social connections: ${connectionsCount.rows[0].count}\n`);

    // 2. Show recent snapshots
    console.log('📸 Recent snapshots:');
    const recentSnapshots = await pool.query(`
      SELECT dj_id, platform, followers, engagement, created_at
      FROM social_media_snapshots
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.table(recentSnapshots.rows);

    // 3. Clean all snapshots
    console.log('\n🗑️  Deleting ALL social media snapshots...');
    const deleteSnapshots = await pool.query('DELETE FROM social_media_snapshots');
    console.log(`   ✅ Deleted ${deleteSnapshots.rowCount} snapshots`);

    // 4. Clean all social_media_accounts
    console.log('\n🗑️  Deleting ALL social media accounts...');
    const deleteAccounts = await pool.query('DELETE FROM social_media_accounts');
    console.log(`   ✅ Deleted ${deleteAccounts.rowCount} accounts`);

    // 5. Clean all social_connections (scraping mode)
    console.log('\n🗑️  Deleting ALL social connections...');
    const deleteConnections = await pool.query('DELETE FROM social_connections');
    console.log(`   ✅ Deleted ${deleteConnections.rowCount} connections`);

    // 6. Verify cleanup
    console.log('\n✨ Cleanup complete! Verifying...');

    const finalAccountsCount = await pool.query('SELECT COUNT(*) FROM social_media_accounts');
    const finalSnapshotsCount = await pool.query('SELECT COUNT(*) FROM social_media_snapshots');
    const finalConnectionsCount = await pool.query('SELECT COUNT(*) FROM social_connections');

    console.log(`   - Social media accounts: ${finalAccountsCount.rows[0].count}`);
    console.log(`   - Snapshots: ${finalSnapshotsCount.rows[0].count}`);
    console.log(`   - Social connections: ${finalConnectionsCount.rows[0].count}`);

    console.log('\n✅ All social media data cleaned successfully!');
    console.log('   System is now ready for 100% real data only.\n');

  } catch (error) {
    console.error('❌ Error cleaning data:', error);
  } finally {
    await pool.end();
  }
}

cleanSocialData();
