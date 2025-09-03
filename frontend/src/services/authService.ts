export interface User {
  id: string;
  email: string;
  name: string;
}

class AuthService {
  private currentUser: User | null = null;
  private baseUrl = 'https://patent-forge-backend.onrender.com/api';

  async login(email: string): Promise<User | null> {
    try {
      console.log('AuthService: Attempting login with email:', email);
      const response = await fetch(`${this.baseUrl}/user/profile`, {
        headers: { 'email': email }
      });
      
      console.log('AuthService: Response status:', response.status);
      
      if (response.ok) {
        this.currentUser = await response.json();
        console.log('AuthService: Login successful, user:', this.currentUser);
        
        // Store email in localStorage with multiple fallbacks
        try {
          localStorage.setItem('userEmail', email);
          console.log('AuthService: Stored userEmail in localStorage:', email);
          
          // Verify it was stored correctly
          const storedEmail = localStorage.getItem('userEmail');
          console.log('AuthService: Verified stored email:', storedEmail);
          
          if (storedEmail !== email) {
            console.error('AuthService: Email storage verification failed!');
            // Try alternative storage method
            sessionStorage.setItem('userEmail', email);
            console.log('AuthService: Stored email in sessionStorage as fallback');
          }
        } catch (storageError) {
          console.error('AuthService: localStorage error:', storageError);
          // Fallback to sessionStorage
          sessionStorage.setItem('userEmail', email);
          console.log('AuthService: Used sessionStorage fallback');
        }
        
        return this.currentUser;
      }
      console.log('AuthService: Login failed, response not ok');
      return null;
    } catch (error) {
      console.error('AuthService: Login error:', error);
      return null;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('userEmail');
  }

  // Auto-login on page load
  async autoLogin(): Promise<User | null> {
    // Try localStorage first, then sessionStorage as fallback
    let savedEmail = localStorage.getItem('userEmail');
    console.log('AuthService: Auto-login, savedEmail from localStorage:', savedEmail);
    
    if (!savedEmail) {
      savedEmail = sessionStorage.getItem('userEmail');
      console.log('AuthService: Auto-login, savedEmail from sessionStorage:', savedEmail);
    }
    
    if (savedEmail) {
      console.log('AuthService: Attempting auto-login with saved email');
      return await this.login(savedEmail);
    }
    console.log('AuthService: No saved email found, auto-login failed');
    return null;
  }
}

export const authService = new AuthService();
