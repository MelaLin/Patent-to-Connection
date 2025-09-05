const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to Supabase PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

// Initialize database tables
async function initializeDatabase() {
  try {
    // Test connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    console.log('✅ Database connection successful');
    console.log('📝 Note: Run migrations manually: ./migrations/run-migrations.sh');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('💡 Make sure DATABASE_URL is set and migrations are applied');
    throw error;
  }
}

module.exports = {
  pool,
  initializeDatabase
};
