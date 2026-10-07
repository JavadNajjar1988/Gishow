import React, {createContext, useContext, useEffect, useState} from 'react';
import {Account, api, ApiError} from './api';
interface AuthState {
  user: Account | null; loading: boolean; error: string; refresh: () => Promise<void>;
  setUser: (user: Account | null) => void; logout: () => Promise<void>;
}
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = async () => {
    try { setUser(await api<Account>('/auth/me')); setError(''); }
    catch (e) { setUser(null); if (!(e instanceof ApiError && e.status === 401)) setError((e as Error).message); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, []);
  // Permissions are fetched again on focus, not retained as an authorization source.
  useEffect(() => {
    const focused = () => void refresh();
    window.addEventListener('focus', focused);
    return () => window.removeEventListener('focus', focused);
  }, []);
  const logout = async () => { await api('/auth/logout', 'POST'); setUser(null); };
  return <AuthContext.Provider value={{user, loading, error, refresh, setUser, logout}}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const state = useContext(AuthContext);
  if (!state) throw new Error('AuthProvider missing');
  return state;
}
