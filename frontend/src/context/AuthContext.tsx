import { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/auth.types';
import { authService } from '../services/authService';
import { clearToken } from '../utils/tokenStorage';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isInitialising: boolean;
  isSubmitting: boolean;
  error: string | null;
  register: (...args: Parameters<typeof authService.register>) => Promise<void>;
  login: (...args: Parameters<typeof authService.login>) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isInitialising, setIsInitialising] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const fetchMe = async () => {
    try {
      const u = await authService.getMe();
      setUser(u);
    } catch {
      setUser(null);
      setAccessToken(null);
      clearToken();
    }
  };

  const refreshSession = async () => {
    try {
      const token = await authService.refreshSession();
      setAccessToken(token);
      await fetchMe();
    } catch {
      setUser(null);
      setAccessToken(null);
      clearToken();
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        await refreshSession();
      } finally {
        setIsInitialising(false);
      }
    };
    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (...args: Parameters<typeof authService.login>) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await authService.login(...args);
      setAccessToken(res.accessToken);
      setUser(res.user);
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Login failed');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const register = async (...args: Parameters<typeof authService.register>) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await authService.register(...args);
      setAccessToken(res.accessToken);
      setUser(res.user);
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Registration failed');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setAccessToken(null);
      clearToken();
      setIsSubmitting(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isInitialising,
        isSubmitting,
        error,
        register,
        login,
        logout,
        refreshSession,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
