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
  private baseUrl = 'http://localhost:3001/api';

  // Save a patent
  async savePatent(patentData: PatentSaveData): Promise<{ success: boolean; data?: SavedPatent; error?: string }> {
    console.log('Sending patent data:', patentData);
    
    try {
      const response = await fetch(`${this.baseUrl}/savePatent`, {
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

  // Save an inventor
  async saveInventor(inventorData: InventorSaveData): Promise<{ success: boolean; data?: SavedInventor; error?: string }> {
    console.log('Sending inventor data:', inventorData);
    
    try {
      const response = await fetch(`${this.baseUrl}/saveInventor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(`${this.baseUrl}/saveQuery`, {
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
    try {
      const response = await fetch(`${this.baseUrl}/watchlist`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Failed to fetch watchlist');
      }

      const data = await response.json();
      console.log('Watchlist data:', data);
      return data;
    } catch (error) {
      console.error('Network error fetching watchlist:', error);
      throw new Error(error instanceof Error ? error.message : 'Network error fetching watchlist');
    }
  }
}

export const saveService = new SaveService();
