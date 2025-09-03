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
        localStorage.setItem('userEmail', email);
        console.log('AuthService: Stored userEmail in localStorage:', email);
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
    const savedEmail = localStorage.getItem('userEmail');
    console.log('AuthService: Auto-login, savedEmail from localStorage:', savedEmail);
    if (savedEmail) {
      console.log('AuthService: Attempting auto-login with saved email');
      return await this.login(savedEmail);
    }
    console.log('AuthService: No saved email found, auto-login failed');
    return null;
  }
}

export const authService = new AuthService();
