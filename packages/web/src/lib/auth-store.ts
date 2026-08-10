import { createContext, useContext, useState, useCallback, createElement, type ReactNode } from 'react';

export interface AuthState {
  token: string | null;
  churchId: string | null;
  churchName: string | null;
  role: string | null;
  email: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string) => void;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
}

interface JwtPayload {
  sub: string;
  churchId: string;
  role: string;
  tokenVersion: number;
  iat: number;
  exp: number;
}

const STORAGE_KEYS = {
  token: 'token',
  churchId: 'churchId',
  churchName: 'churchName',
  role: 'role',
  email: 'email',
} as const;

function base64UrlDecode(str: string): string {
  return str.replace(/-/g, '+').replace(/_/g, '/');
}

function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(base64UrlDecode(parts[1]!))) as JwtPayload;
  } catch {
    return null;
  }
}

function loadFromStorage(): Omit<AuthState, 'isLoading'> {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (!token) return { token: null, churchId: null, churchName: null, role: null, email: null };

  const payload = parseJwtPayload(token);
  if (!payload || payload.exp < Date.now() / 1000) {
    for (const key of Object.values(STORAGE_KEYS)) {
      localStorage.removeItem(key);
    }
    return { token: null, churchId: null, churchName: null, role: null, email: null };
  }

  return {
    token,
    churchId: localStorage.getItem(STORAGE_KEYS.churchId) ?? payload.churchId,
    churchName: localStorage.getItem(STORAGE_KEYS.churchName),
    role: localStorage.getItem(STORAGE_KEYS.role) ?? payload.role,
    email: localStorage.getItem(STORAGE_KEYS.email) ?? payload.sub,
  };
}

function saveToStorage(state: Omit<AuthState, 'isLoading'>): void {
  if (state.token) {
    localStorage.setItem(STORAGE_KEYS.token, state.token);
    if (state.churchId) localStorage.setItem(STORAGE_KEYS.churchId, state.churchId);
    else localStorage.removeItem(STORAGE_KEYS.churchId);
    if (state.churchName) localStorage.setItem(STORAGE_KEYS.churchName, state.churchName);
    else localStorage.removeItem(STORAGE_KEYS.churchName);
    if (state.role) localStorage.setItem(STORAGE_KEYS.role, state.role);
    else localStorage.removeItem(STORAGE_KEYS.role);
    if (state.email) localStorage.setItem(STORAGE_KEYS.email, state.email);
    else localStorage.removeItem(STORAGE_KEYS.email);
  } else {
    for (const key of Object.values(STORAGE_KEYS)) {
      localStorage.removeItem(key);
    }
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = loadFromStorage();
  const [token, setToken] = useState<string | null>(initial.token);
  const [churchId, setChurchId] = useState<string | null>(initial.churchId);
  const [churchName, setChurchName] = useState<string | null>(initial.churchName);
  const [role, setRole] = useState<string | null>(initial.role);
  const [email, setEmail] = useState<string | null>(initial.email);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback((newToken: string) => {
    const payload = parseJwtPayload(newToken);
    if (!payload) return;

    const next: Omit<AuthState, 'isLoading'> = {
      token: newToken,
      churchId: payload.churchId,
      churchName: localStorage.getItem(STORAGE_KEYS.churchName),
      role: payload.role,
      email: payload.sub,
    };

    saveToStorage(next);
    setToken(next.token);
    setChurchId(next.churchId);
    setChurchName(next.churchName);
    setRole(next.role);
    setEmail(next.email);
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    const cleared: Omit<AuthState, 'isLoading'> = {
      token: null,
      churchId: null,
      churchName: null,
      role: null,
      email: null,
    };
    saveToStorage(cleared);
    setToken(null);
    setChurchId(null);
    setChurchName(null);
    setRole(null);
    setEmail(null);
    setIsLoading(false);
  }, []);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const value: AuthContextValue = {
    token,
    churchId,
    churchName,
    role,
    email,
    isLoading,
    login,
    logout,
    getAuthHeaders,
  };

  return createElement(AuthContext.Provider, { value }, children);
}
