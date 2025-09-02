// Service for saving patents and inventors
export interface SavedPatent {
  id: number;
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
  id: number;
  name: string;
  linkedin_url?: string;
  associated_patent_id?: number;
  user_id: string;
  created_at: string;
}

export interface SavedQuery {
  id: number;
  query: string;
  user_id: string;
  created_at: string;
}

export interface SavedAlert {
  id: number;
  query: string;
  frequency: string;
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
  associated_patent_id?: number;
}

export interface QuerySaveData {
  query: string;
}

export interface AlertCreateData {
  query: string;
  frequency: string; // "daily", "weekly", "monthly"
}

export interface WatchlistData {
  patents: SavedPatent[];
  queries: SavedQuery[];
}

// New API contract interfaces
export interface SavePatentRequest {
  patentNumber: string;
  title: string;
  abstract: string;
  assignee: string;
  inventors: string[];
  filingDate?: string;
  googlePatentsLink?: string;
  tags?: string[];
}

export interface SaveQueryRequest {
  query: string;
  filters?: Record<string, any>;
}

export interface SavePatentResponse {
  ok: boolean;
  patent?: any;
  error?: string;
}

export interface SaveQueryResponse {
  ok: boolean;
  query?: any;
  error?: string;
}

export interface WatchlistResponse {
  ok: boolean;
  patents: any[];
  queries: any[];
  error?: string;
}

class SaveService {
  private baseUrl = '/api';

  // New API contract methods
  async savePatentNew(patentData: SavePatentRequest): Promise<SavePatentResponse> {
    console.debug("save patent payload", patentData);
    
    try {
      const response = await fetch(`${this.baseUrl}/watchlist/patents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patentData),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Save patent failed");
      }
      return data;
    } catch (error) {
      console.error('Network error saving patent:', error);
      return { 
        ok: false, 
        error: error instanceof Error ? error.message : 'Network error saving patent' 
      };
    }
  }

  async saveQueryNew(queryData: SaveQueryRequest): Promise<SaveQueryResponse> {
    console.debug("save query payload", queryData);
    
    try {
      const response = await fetch(`${this.baseUrl}/watchlist/queries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(queryData),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Save query failed");
      }
      return data;
    } catch (error) {
      console.error('Network error saving query:', error);
      return { 
        ok: false, 
        error: error instanceof Error ? error.message : 'Network error saving query' 
      };
    }
  }

  async getWatchlistNew(): Promise<WatchlistResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/watchlist`);
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to fetch watchlist");
      }
      return data;
    } catch (error) {
      console.error('Network error fetching watchlist:', error);
      return { 
        ok: false, 
        patents: [], 
        queries: [], 
        error: error instanceof Error ? error.message : 'Network error fetching watchlist' 
      };
    }
  }

  // Legacy methods for backward compatibility
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
          errorDetail = errorJson.detail || errorJson.error || errorDetail;
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

  // Get all saved patents
  async getSavedPatents(): Promise<SavedPatent[]> {
    const response = await fetch(`${this.baseUrl}/patents/saved`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch saved patents');
    }

    return response.json();
  }

  // Save an inventor
  async saveInventor(inventorData: InventorSaveData): Promise<SavedInventor> {
    console.log('Sending inventor data:', inventorData);
    
    const response = await fetch(`${this.baseUrl}/inventors/save`, {
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
        errorDetail = errorJson.detail || errorDetail;
      } catch (e) {
        errorDetail = errorText || errorDetail;
      }
      
      throw new Error(errorDetail);
    }

    const result = await response.json();
    console.log('Save inventor result:', result);
    return result;
  }

  // Get all saved inventors
  async getSavedInventors(): Promise<SavedInventor[]> {
    const response = await fetch(`${this.baseUrl}/inventors/saved`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch saved inventors');
    }

    return response.json();
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
          errorDetail = errorJson.detail || errorJson.error || errorDetail;
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

  // Get all saved queries
  async getSavedQueries(): Promise<SavedQuery[]> {
    const response = await fetch(`${this.baseUrl}/queries/saved`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch saved queries');
    }

    return response.json();
  }

  // Get watchlist (all saved patents and queries)
  async getWatchlist(): Promise<WatchlistData> {
    const response = await fetch(`${this.baseUrl}/watchlist`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch watchlist');
    }

    return response.json();
  }

  // Create an alert
  async createAlert(alertData: AlertCreateData): Promise<SavedAlert> {
    console.log('Sending alert data:', alertData);
    
    const response = await fetch(`${this.baseUrl}/createAlert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alertData),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      
      let errorDetail = 'Failed to create alert';
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.detail || errorDetail;
      } catch (e) {
        errorDetail = errorText || errorDetail;
      }
      
      throw new Error(errorDetail);
    }

    const result = await response.json();
    console.log('Create alert result:', result);
    return result;
  }

  // Get all saved alerts
  async getSavedAlerts(): Promise<SavedAlert[]> {
    const response = await fetch(`${this.baseUrl}/alerts/saved`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch saved alerts');
    }

    return response.json();
  }
}

export const saveService = new SaveService();
