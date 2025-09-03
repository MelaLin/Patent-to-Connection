// Service for saving patents and inventors
export interface SavedPatent {
  id: string;
  title: string;
  abstract: string;
  assignee: string;
  inventors: Array<{ name: string; linkedin_url?: string }>;
  link?: string;
  date_filed?: string;
  user_id: string;
  created_at: string;
  saved_at?: string;
}

export interface SavedInventor {
  id: string;
  name: string;
  linkedin_url?: string;
  associated_patent_id?: string;
  user_id: string;
  created_at: string;
}

export interface SavedQuery {
  id: string;
  query: string;
  filters?: Record<string, any>;
  user_id: string;
  created_at: string;
}

export interface PatentSaveData {
  title: string;
  abstract: string;
  assignee: string;
  inventors: Array<{ name: string; linkedin_url?: string }>;
  link?: string;
  date_filed?: string;
}

export interface InventorSaveData {
  name: string;
  linkedin_url?: string;
  associated_patent_id?: string;
}

export interface QuerySaveData {
  query: string;
  filters?: Record<string, any>;
}

export interface WatchlistData {
  patents: SavedPatent[];
  queries: SavedQuery[];
  inventors: SavedInventor[];
}

class SaveService {
  private baseUrl = 'https://patent-forge-backend.onrender.com/api';

  private getHeaders() {
    const userEmail = localStorage.getItem('userEmail');
    console.log('Getting headers, userEmail from localStorage:', userEmail);
    console.log('localStorage contents:', { userEmail: localStorage.getItem('userEmail') });
    return {
      'Content-Type': 'application/json',
      'email': userEmail || ''
    };
  }

  // Save a patent
  async savePatent(patentData: PatentSaveData): Promise<{ success: boolean; data?: SavedPatent; error?: string }> {
    console.log('Sending patent data:', patentData);
    
    try {
      const response = await fetch(`${this.baseUrl}/watchlist/patents`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(patentData),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorDetail = 'Failed to save patent';
        try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.error || errorDetail;
        } catch (e) {
          errorDetail = errorText || errorDetail;
        }
        
        return { success: false, error: errorDetail };
      }

      const result = await response.json();
      console.log('Save patent result:', result);
      return result;
    } catch (error) {
      console.error('Network error saving patent:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error saving patent' 
      };
    }
  }

  // Save an inventor
  async saveInventor(inventorData: InventorSaveData): Promise<{ success: boolean; data?: SavedInventor; error?: string }> {
    console.log('Sending inventor data:', inventorData);
    
    try {
      const response = await fetch(`${this.baseUrl}/watchlist/inventors`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(inventorData),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorDetail = 'Failed to save inventor';
        try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.error || errorDetail;
        } catch (e) {
          errorDetail = errorText || errorDetail;
        }
        
        return { success: false, error: errorDetail };
      }

      const result = await response.json();
      console.log('Save inventor result:', result);
      return result;
    } catch (error) {
      console.error('Network error saving inventor:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error saving inventor' 
      };
    }
  }

  // Alternative inventor save method for compatibility
  async saveInventorAlternative(inventorData: InventorSaveData): Promise<{ success: boolean; inventorId?: string; data?: SavedInventor; error?: string }> {
    console.log('Sending inventor data to alternative endpoint:', inventorData);
    
    try {
      const response = await fetch(`${this.baseUrl}/watchlist/inventors`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(inventorData),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorDetail = 'Failed to save inventor';
        try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.error || errorDetail;
        } catch (e) {
          errorDetail = errorText || errorDetail;
        }
        
        return { success: false, error: errorDetail };
      }

      const result = await response.json();
      console.log('Save inventor result:', result);
      return result;
    } catch (error) {
      console.error('Network error saving inventor:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error saving inventor' 
      };
    }
  }

  // Save a query
  async saveQuery(queryData: QuerySaveData): Promise<{ success: boolean; data?: SavedQuery; error?: string }> {
    console.log('Sending query data:', queryData);
    
    try {
      const response = await fetch(`${this.baseUrl}/watchlist/queries`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(queryData),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorDetail = 'Failed to save query';
        try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.error || errorDetail;
        } catch (e) {
          errorDetail = errorText || errorDetail;
        }
        
        return { success: false, error: errorDetail };
      }

      const result = await response.json();
      console.log('Save query result:', result);
      return result;
    } catch (error) {
      console.error('Network error saving query:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error saving query' 
      };
    }
  }

  // Alternative patent save method for compatibility
  async savePatentAlternative(patentData: PatentSaveData): Promise<{ success: boolean; data?: SavedPatent; error?: string }> {
    console.log('Sending patent data to alternative endpoint:', patentData);
    
    try {
      const response = await fetch(`${this.baseUrl}/watchlist/patents`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(patentData),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorDetail = 'Failed to save patent';
        try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.error || errorDetail;
        } catch (e) {
          errorDetail = errorText || errorDetail;
        }
        
        return { success: false, error: errorDetail };
      }

      const result = await response.json();
      console.log('Save patent result:', result);
      return result;
    } catch (error) {
      console.error('Network error saving patent:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error saving patent' 
      };
    }
  }

  // Alternative query save method for compatibility
  async saveQueryAlternative(queryData: QuerySaveData): Promise<{ success: boolean; data?: SavedQuery; error?: string }> {
    console.log('Sending query data to alternative endpoint:', queryData);
    
    try {
      const response = await fetch(`${this.baseUrl}/watchlist/queries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryData),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorDetail = 'Failed to save query';
        try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.error || errorDetail;
        } catch (e) {
          errorDetail = errorText || errorDetail;
        }
        
        return { success: false, error: errorDetail };
      }

      const result = await response.json();
      console.log('Save query result:', result);
      return result;
    } catch (error) {
      console.error('Network error saving query:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error saving query' 
      };
    }
  }

  // Alternative methods for compatibility with different endpoint patterns
  async savePatentToWatchlist(patentData: PatentSaveData): Promise<{ success: boolean; data?: SavedPatent; error?: string }> {
    console.log('Sending patent data to watchlist endpoint:', patentData);
    
    try {
      const response = await fetch(`${this.baseUrl}/watchlist/patents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patentData),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorDetail = 'Failed to save patent';
        try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.error || errorDetail;
        } catch (e) {
          errorDetail = errorText || errorDetail;
        }
        
        return { success: false, error: errorDetail };
      }

      const result = await response.json();
      console.log('Save patent result:', result);
      return result;
    } catch (error) {
      console.error('Network error saving patent:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error saving patent' 
      };
    }
  }

  async saveQueryToWatchlist(queryData: QuerySaveData): Promise<{ success: boolean; data?: SavedQuery; error?: string }> {
    console.log('Sending query data to watchlist endpoint:', queryData);
    
    try {
      const response = await fetch(`${this.baseUrl}/watchlist/queries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryData),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorDetail = 'Failed to save query';
        try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.error || errorDetail;
        } catch (e) {
          errorDetail = errorText || errorDetail;
        }
        
        return { success: false, error: errorDetail };
      }

      const result = await response.json();
      console.log('Save query result:', result);
      return result;
    } catch (error) {
      console.error('Network error saving query:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error saving query' 
      };
    }
  }

  // Get watchlist (all saved patents, queries, and inventors)
  async getWatchlist(): Promise<WatchlistData> {
    console.log('Fetching watchlist from:', `${this.baseUrl}/watchlist`);
    const headers = this.getHeaders();
    console.log('Headers being sent:', headers);
    
    try {
      const response = await fetch(`${this.baseUrl}/watchlist`, {
        headers: headers
      });
      
      console.log('Watchlist response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Failed to fetch watchlist');
      }

      const data = await response.json();
      console.log('Watchlist data received:', data);
      return data;
    } catch (error) {
      console.error('Network error fetching watchlist:', error);
      throw new Error(error instanceof Error ? error.message : 'Network error fetching watchlist');
    }
  }

  // Delete a saved patent
  async deletePatent(patentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/watchlist/patents/${patentId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorDetail = 'Failed to delete patent';
        try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.error || errorDetail;
        } catch (e) {
          errorDetail = errorText || errorDetail;
        }
        
        return { success: false, error: errorDetail };
      }

      return { success: true };
    } catch (error) {
      console.error('Network error deleting patent:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error deleting patent' 
      };
    }
  }

  // Delete a saved query
  async deleteQuery(queryId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/watchlist/queries/${queryId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorDetail = 'Failed to delete query';
        try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.error || errorDetail;
        } catch (e) {
          errorDetail = errorText || errorDetail;
        }
        
        return { success: false, error: errorDetail };
      }

      return { success: true };
    } catch (error) {
      console.error('Network error deleting query:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error deleting query' 
      };
    }
  }

  // Delete a saved inventor
  async deleteInventor(inventorId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/watchlist/inventors/${inventorId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorDetail = 'Failed to delete inventor';
        try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.error || errorDetail;
        } catch (e) {
          errorDetail = errorText || errorDetail;
        }
        
        return { success: false, error: errorDetail };
      }

      return { success: true };
    } catch (error) {
      console.error('Network error deleting inventor:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Network error deleting inventor' 
      };
    }
  }
}

export const saveService = new SaveService();
