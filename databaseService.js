const { pool } = require('./database');

class DatabaseService {
  // User operations
  async getUserByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  async createUser(email, name) {
    const result = await pool.query(
      'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *',
      [email, name]
    );
    return result.rows[0];
  }

  async getOrCreateUser(email, name) {
    let user = await this.getUserByEmail(email);
    if (!user) {
      user = await this.createUser(email, name);
    }
    return user;
  }

  // Thesis operations
  async getTheses(userId) {
    const result = await pool.query(
      'SELECT * FROM theses WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  async createThesis(userId, title, content) {
    const result = await pool.query(
      'INSERT INTO theses (user_id, title, content) VALUES ($1, $2, $3) RETURNING *',
      [userId, title, content]
    );
    return result.rows[0];
  }

  async updateThesisStarred(userId, thesisId, starred) {
    const result = await pool.query(
      'UPDATE theses SET starred = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
      [starred, thesisId, userId]
    );
    return result.rows[0];
  }

  async deleteThesis(userId, thesisId) {
    const result = await pool.query(
      'DELETE FROM theses WHERE id = $1 AND user_id = $2 RETURNING *',
      [thesisId, userId]
    );
    return result.rows[0];
  }

  async getStarredThesis(userId) {
    const result = await pool.query(
      'SELECT * FROM theses WHERE user_id = $1 AND starred = true ORDER BY updated_at DESC LIMIT 1',
      [userId]
    );
    return result.rows[0] || null;
  }

  // Patent operations
  async getPatents(userId) {
    const result = await pool.query(
      'SELECT * FROM patents WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  async createPatent(userId, patentData) {
    const { patent_id, title, abstract, assignee, inventors, link, date_filed } = patentData;
    const result = await pool.query(
      'INSERT INTO patents (user_id, patent_id, title, abstract, assignee, inventors, link, date_filed) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [userId, patent_id, title, abstract, assignee, inventors ? JSON.stringify(inventors) : null, link, date_filed]
    );
    return result.rows[0];
  }

  async deletePatent(userId, patentId) {
    const result = await pool.query(
      'DELETE FROM patents WHERE id = $1 AND user_id = $2 RETURNING *',
      [patentId, userId]
    );
    return result.rows[0];
  }


  // Watchlist operations
  async getWatchlist(userId) {
    const result = await pool.query(
      'SELECT * FROM watchlist WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  async addToWatchlist(userId, itemType, itemId, itemData = null) {
    const result = await pool.query(
      'INSERT INTO watchlist (user_id, item_type, item_id, item_data) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, item_type, item_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP RETURNING *',
      [userId, itemType, itemId, itemData ? JSON.stringify(itemData) : null]
    );
    return result.rows[0];
  }

  async removeFromWatchlist(userId, itemType, itemId) {
    const result = await pool.query(
      'DELETE FROM watchlist WHERE user_id = $1 AND item_type = $2 AND item_id = $3 RETURNING *',
      [userId, itemType, itemId]
    );
    return result.rows[0];
  }

  async deleteWatchlistItem(userId, itemId) {
    const result = await pool.query(
      'DELETE FROM watchlist WHERE id = $1 AND user_id = $2 RETURNING *',
      [itemId, userId]
    );
    return result.rows[0];
  }

  // Get watchlist data in the format expected by frontend
  async getWatchlistData(userId) {
    const watchlist = await this.getWatchlist(userId);
    
    // Group by item type
    const patents = [];
    const queries = [];
    const inventors = [];

    for (const item of watchlist) {
      const itemData = item.item_data ? JSON.parse(item.item_data) : {};
      
      switch (item.item_type) {
        case 'patent':
          patents.push({
            id: item.id,
            patent_id: item.item_id,
            title: itemData.title || '',
            abstract: itemData.abstract || '',
            assignee: itemData.assignee || '',
            inventors: itemData.inventors || [],
            link: itemData.link || '',
            date_filed: itemData.date_filed || '',
            created_at: item.created_at
          });
          break;
        case 'query':
          queries.push({
            id: item.id,
            query: item.item_id,
            created_at: item.created_at
          });
          break;
        case 'inventor':
          inventors.push({
            id: item.id,
            name: item.item_id,
            linkedin_url: itemData.linkedin_url || '',
            associated_patent_id: itemData.associated_patent_id || '',
            created_at: item.created_at
          });
          break;
      }
    }

    return {
      patents,
      queries,
      inventors
    };
  }
}

module.exports = new DatabaseService();
