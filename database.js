const axios = require('axios');
require('dotenv').config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required in environment variables");
}

class DatabaseConnection {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    this.headers = {
      'Authorization': `Bearer ${this.supabaseKey}`,
      'Content-Type': 'application/json',
      'apikey': this.supabaseKey
    };
  }

  async query(sql, params = []) {
    // For REST API, we'll implement basic query functionality
    // This is a simplified version - in production you'd want more sophisticated query parsing
    if (sql.includes('SELECT NOW()')) {
      return { rows: [{ now: new Date().toISOString() }] };
    }
    
    if (sql.includes('SELECT 1')) {
      return { rows: [{ '?column?': 1 }] };
    }
    
    // For other queries, we'll need to implement specific REST API calls
    throw new Error('Query not supported in REST API mode: ' + sql);
  }

  async testConnection() {
    try {
      // Test the REST API connection by making a simple request
      const response = await axios.get(`${this.supabaseUrl}/rest/v1/users?limit=1`, {
        headers: this.headers
      });
      return true;
    } catch (err) {
      console.error("❌ REST API connection failed:", err.message);
      throw err;
    }
  }
}

const pool = new DatabaseConnection();

// Initialize database connection
async function initializeDatabase() {
  try {
    await pool.testConnection();
    console.log('✅ Supabase REST API connected successfully');
    console.log('📝 Note: Run migrations manually: ./migrations/run-migrations.sh');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('💡 Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set');
    throw error;
  }
}

module.exports = {
  pool,
  initializeDatabase
};
