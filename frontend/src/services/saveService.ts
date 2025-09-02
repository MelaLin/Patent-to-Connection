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
}

export interface SavedInventor {
  id: number;
  name: string;
  linkedin_url?: string;
  associated_patent_id?: number;
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

class SaveService {
  private baseUrl = '/api';

  // Save a patent
  async savePatent(patentData: PatentSaveData): Promise<SavedPatent> {
    const response = await fetch(`${this.baseUrl}/patents/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to save patent');
    }

    return response.json();
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
    const response = await fetch(`${this.baseUrl}/inventors/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inventorData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to save inventor');
    }

    return response.json();
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
}

export const saveService = new SaveService();
