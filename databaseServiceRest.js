const axios = require('axios');

class DatabaseServiceRest {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL || 'https://dhycgbxwtfbxjjgklbee.supabase.co';
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!this.supabaseKey) {
      throw new Error('SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    }
    
    this.headers = {
      'Authorization': `Bearer ${this.supabaseKey}`,
      'Content-Type': 'application/json',
      'apikey': this.supabaseKey
    };
  }

  // User operations
  async getUserByEmail(email) {
    const response = await axios.get(
      `${this.supabaseUrl}/rest/v1/users?email=eq.${email}`,
      { headers: this.headers }
    );
    return response.data[0] || null;
  }

  async createUser(email, name) {
    const response = await axios.post(
      `${this.supabaseUrl}/rest/v1/users`,
      { email, name },
      { headers: this.headers }
    );
    return response.data[0];
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
    const response = await axios.get(
      `${this.supabaseUrl}/rest/v1/theses?user_id=eq.${userId}&order=created_at.desc`,
      { headers: this.headers }
    );
    return response.data;
  }

  async createThesis(userId, title, content) {
    const response = await axios.post(
      `${this.supabaseUrl}/rest/v1/theses`,
      { user_id: userId, title, content },
      { headers: this.headers }
    );
    return response.data[0];
  }

  async updateThesisStarred(userId, thesisId, starred) {
    const response = await axios.patch(
      `${this.supabaseUrl}/rest/v1/theses?id=eq.${thesisId}&user_id=eq.${userId}`,
      { starred, updated_at: new Date().toISOString() },
      { headers: this.headers }
    );
    return response.data[0];
  }

  async deleteThesis(userId, thesisId) {
    const response = await axios.delete(
      `${this.supabaseUrl}/rest/v1/theses?id=eq.${thesisId}&user_id=eq.${userId}`,
      { headers: this.headers }
    );
    return response.data[0];
  }

  async getStarredThesis(userId) {
    const response = await axios.get(
      `${this.supabaseUrl}/rest/v1/theses?user_id=eq.${userId}&starred=eq.true&order=updated_at.desc&limit=1`,
      { headers: this.headers }
    );
    return response.data[0] || null;
  }

  // Patent operations
  async getPatents(userId) {
    const response = await axios.get(
      `${this.supabaseUrl}/rest/v1/patents?user_id=eq.${userId}&order=created_at.desc`,
      { headers: this.headers }
    );
    return response.data;
  }

  async createPatent(userId, patentData) {
    const response = await axios.post(
      `${this.supabaseUrl}/rest/v1/patents`,
      { user_id: userId, ...patentData },
      { headers: this.headers }
    );
    return response.data[0];
  }

  async deletePatent(userId, patentId) {
    const response = await axios.delete(
      `${this.supabaseUrl}/rest/v1/patents?id=eq.${patentId}&user_id=eq.${userId}`,
      { headers: this.headers }
    );
    return response.data[0];
  }

  // Watchlist operations
  async getWatchlist(userId) {
    const response = await axios.get(
      `${this.supabaseUrl}/rest/v1/watchlist?user_id=eq.${userId}&order=created_at.desc`,
      { headers: this.headers }
    );
    return response.data;
  }

  async addToWatchlist(userId, itemType, itemId, itemData = null) {
    const response = await axios.post(
      `${this.supabaseUrl}/rest/v1/watchlist`,
      { 
        user_id: userId, 
        item_type: itemType, 
        item_id: itemId, 
        item_data: itemData 
      },
      { headers: this.headers }
    );
    return response.data[0];
  }

  async removeFromWatchlist(userId, itemType, itemId) {
    const response = await axios.delete(
      `${this.supabaseUrl}/rest/v1/watchlist?user_id=eq.${userId}&item_type=eq.${itemType}&item_id=eq.${itemId}`,
      { headers: this.headers }
    );
    return response.data[0];
  }

  async deleteWatchlistItem(userId, itemId) {
    const response = await axios.delete(
      `${this.supabaseUrl}/rest/v1/watchlist?id=eq.${itemId}&user_id=eq.${userId}`,
      { headers: this.headers }
    );
    return response.data[0];
  }

  // Get watchlist data in the format expected by frontend
  async getWatchlistData(userId) {
    const watchlist = await this.getWatchlist(userId);
    
    // Group by item type
    const patents = [];
    const queries = [];
    const inventors = [];

    for (const item of watchlist) {
      const itemData = item.item_data || {};
      
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

module.exports = new DatabaseServiceRest();
