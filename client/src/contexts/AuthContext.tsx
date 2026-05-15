import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authApi from '../api/auth';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // Handle Google OAuth hash redirect: #token=JWT
      const hash = window.location.hash;
      if (hash.includes('token=')) {
        const params = new URLSearchParams(hash.slice(1));
        const token = params.get('token');
        if (token) {
          localStorage.setItem('token', token);
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          try {
            const data = await authApi.getMe();
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            setIsLoading(false);
            window.location.replace('/app/dashboard');
            return;
          } catch {
            localStorage.removeItem('token');
          }
        }
      }

      // Restore session from localStorage
      const stored = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (stored && token) {
        try {
          setUser(JSON.parse(stored) as User);
        } catch {
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    init();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    window.location.replace('/app/dashboard');
  }, []);

  const register = useCallback(async (formData: { email: string; password: string }) => {
    const data = await authApi.register(formData);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    window.location.replace('/app/dashboard');
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.replace('/auth/login');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// Helper: derive a display name from the user's email
export const displayName = (user: User | null): string => {
  if (!user) return '';
  return user.email.split('@')[0];
};
