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
      const response = await fetch(`${this.baseUrl}/user/profile`, {
        headers: { 'email': email }
      });
      
      if (response.ok) {
        this.currentUser = await response.json();
        localStorage.setItem('userEmail', email);
        return this.currentUser;
      }
      return null;
    } catch (error) {
      console.error('Login error:', error);
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
    if (savedEmail) {
      return await this.login(savedEmail);
    }
    return null;
  }
}

export const authService = new AuthService();
