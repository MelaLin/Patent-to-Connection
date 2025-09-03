export interface Thesis {
  id: string;
  title: string;
  content: string;
  starred: boolean;
  created_at: string;
}

export interface ThesisCreateData {
  title: string;
  content: string;
}

export interface ThesisUpdateData {
  title: string;
  content: string;
}

class ThesisService {
  private baseUrl = 'https://patent-forge-backend.onrender.com/api';

  private getHeaders() {
    // Get email from multiple sources for maximum reliability
    let userEmail: string | null = null;
    
    // Try localStorage first
    userEmail = localStorage.getItem('userEmail');
    console.log('ThesisService: Email from localStorage:', userEmail);
    
    // Try sessionStorage if localStorage is empty
    if (!userEmail) {
      userEmail = sessionStorage.getItem('userEmail');
      console.log('ThesisService: Email from sessionStorage:', userEmail);
    }
    
    // If still no email, this is a critical error
    if (!userEmail) {
      console.error('ThesisService: CRITICAL ERROR - No user email found in storage!');
      throw new Error('User email not found. Please log in again.');
    }
    
    console.log('ThesisService: Using email for request:', userEmail);
    
    return {
      'Content-Type': 'application/json',
      'email': userEmail
    };
  }

  // Get all theses
  async getTheses(): Promise<Thesis[]> {
    try {
      const response = await fetch(`${this.baseUrl}/theses`, {
        headers: this.getHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching theses:', error);
      throw error;
    }
  }

  // Create new thesis
  async createThesis(thesisData: ThesisCreateData): Promise<{ success: boolean; data?: Thesis; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/theses`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(thesisData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to create thesis' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error creating thesis:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Update thesis
  async updateThesis(id: string, thesisData: ThesisUpdateData): Promise<{ success: boolean; data?: Thesis; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/theses/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(thesisData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to update thesis' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error updating thesis:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Delete thesis
  async deleteThesis(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/theses/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to delete thesis' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting thesis:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Star thesis
  async starThesis(id: string): Promise<{ success: boolean; data?: Thesis; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/theses/${id}/star`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to star thesis' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error starring thesis:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Get starred thesis
  async getStarredThesis(): Promise<{ success: boolean; data?: Thesis; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/theses/starred`, {
        headers: this.getHeaders()
      });
      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to fetch starred thesis' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error fetching starred thesis:', error);
      return { success: false, error: 'Network error' };
    }
  }
}

export const thesisService = new ThesisService();
