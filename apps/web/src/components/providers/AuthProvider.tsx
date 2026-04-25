'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  AuthTokenResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '@stackdify/shared-types';
import { apiFetch } from '@/lib/api';

const TOKEN_KEY = 'joy.auth.token';
const USER_KEY = 'joy.auth.user';

interface AuthContextValue {
  token: string;
  user: User | null;
  isReady: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  completeOAuth: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): User | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    window.localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  const persistSession = useCallback((nextToken: string, nextUser: User) => {
    setToken(nextToken);
    setUser(nextUser);
    window.localStorage.setItem(TOKEN_KEY, nextToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }, []);

  const logout = useCallback(() => {
    setToken('');
    setUser(null);
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  }, []);

  const refreshUser = useCallback(
    async (nextToken: string) => {
      const nextUser = await apiFetch<User>('/users/me', undefined, nextToken);
      persistSession(nextToken, nextUser);
    },
    [persistSession],
  );

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY) ?? '';
    const storedUser = readStoredUser();

    setToken(storedToken);
    setUser(storedUser);
    setIsReady(true);

    if (storedToken && !storedUser) {
      void refreshUser(storedToken).catch(logout);
    }
  }, [logout, refreshUser]);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const response = await apiFetch<AuthTokenResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      persistSession(response.accessToken, response.user);
    },
    [persistSession],
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      const response = await apiFetch<AuthTokenResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      persistSession(response.accessToken, response.user);
    },
    [persistSession],
  );

  const completeOAuth = useCallback(
    async (nextToken: string) => {
      await refreshUser(nextToken);
    },
    [refreshUser],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isReady,
      isAuthenticated: Boolean(token),
      login,
      register,
      completeOAuth,
      logout,
    }),
    [completeOAuth, isReady, login, logout, register, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
