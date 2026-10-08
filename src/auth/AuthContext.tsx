import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, AuthSession, LoginCredentials, RecoveryCredentials, UserRole } from '../types';
import { authApi, BackendError } from './api';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  recoverWithCode: (credentials: RecoveryCredentials) => Promise<boolean>;
  clearError: () => void;
  checkPermission: (requiredRole: UserRole | UserRole[], eventId?: number | string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Validate server session on mount via /api/auth/me
  // Preserves cookie-based session verification with server authoritative response
  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await authApi.getCurrentSession();
      if (session && session.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    } catch (err: any) {
      // 401 or 404 indicates no active session or route not ready; clear user
      setUser(null);
      if (err instanceof BackendError && err.status !== 401 && err.status !== 404) {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await authApi.login(credentials);
      if (session && session.user) {
        setUser(session.user);
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err instanceof BackendError ? err.message : 'خطا در ورود به حساب کاربری.';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch (err) {
      // Silently clear local session even if server route returned error
      console.warn('Logout warning:', err);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const recoverWithCode = async (credentials: RecoveryCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await authApi.recoverWithCode(credentials);
      if (session && session.user) {
        setUser(session.user);
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err instanceof BackendError ? err.message : 'کد بازیابی نامعتبر است.';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  /**
   * Server-authoritative role & permission validation.
   * Does NOT synthesize roles from localStorage or browser preferences.
   * Producer authorization strictly restricts to assignedEventIds.
   */
  const checkPermission = (requiredRole: UserRole | UserRole[], eventId?: number | string): boolean => {
    if (!user) return false;

    // Super admin has full capability
    if (user.role === 'super_admin') return true;

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const roleMatched = roles.includes(user.role);

    if (!roleMatched) return false;

    // If checking a specific event for a producer, verify assigned event ids
    if (user.role === 'producer' && eventId !== undefined) {
      if (!user.assignedEventIds || user.assignedEventIds.length === 0) {
        return false;
      }
      const numId = Number(eventId);
      return user.assignedEventIds.includes(numId);
    }

    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        isAuthenticated: !!user,
        login,
        logout,
        recoverWithCode,
        clearError,
        checkPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
