import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

/**
 * Setup test database with admin user
 * Creates admin@intramedia.com with password "admin123"
 */
async function setupTestDB() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'intra_media_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('🔧 Setting up test database...');

    // Hash password admin123
    const passwordHash = await bcrypt.hash('admin123', 10);
    console.log('✅ Password hashed');

    // Create or update admin user
    const result = await pool.query(`
      INSERT INTO users (email, password_hash, user_type, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, email, user_type, role
    `, ['admin@intramedia.com', passwordHash, 'admin', 'admin']);

    console.log('✅ Admin user created/updated:', result.rows[0]);
    console.log('   Email: admin@intramedia.com');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Error setting up test database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupTestDB()
    .then(() => {
      console.log('✅ Test database setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

export default setupTestDB;
