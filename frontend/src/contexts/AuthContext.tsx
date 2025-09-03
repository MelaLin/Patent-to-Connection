import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, User } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
  getCurrentUserEmail: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      console.log('AuthContext: Initializing authentication...');
      const savedUser = await authService.autoLogin();
      console.log('AuthContext: Auto-login result:', savedUser);
      setUser(savedUser);
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (email: string): Promise<boolean> => {
    console.log('AuthContext: Login called with email:', email);
    const user = await authService.login(email);
    console.log('AuthContext: Login result:', user);
    setUser(user);
    return !!user;
  };

  const logout = () => {
    console.log('AuthContext: Logout called');
    authService.logout();
    setUser(null);
  };

  const getCurrentUserEmail = (): string | null => {
    return user?.email || localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getCurrentUserEmail }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
