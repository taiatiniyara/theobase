import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authApi, setTokens, clearTokens, getRefreshToken } from "../lib/api";

interface User {
  id: number;
  email: string;
  role: string;
  conference: { id: number; name: string } | null;
  church: { id: number; name: string } | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    fullName: string,
    conferenceName?: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      setLoading(false);
      return;
    }

    authApi
      .refresh()
      .then((data) => {
        setTokens(data.accessToken, data.refreshToken);
        return authApi.me();
      })
      .then((me) => {
        setUser(me);
      })
      .catch(() => {
        clearTokens();
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    setTokens(data.accessToken, data.refreshToken);
    const me = await authApi.me();
    setUser(me);
  }, []);

  const signup = useCallback(
    async (email: string, password: string, fullName: string, conferenceName?: string) => {
      const data = await authApi.signup({ email, password, fullName, conferenceName });
      setTokens(data.accessToken, data.refreshToken);
      const me = await authApi.me();
      setUser(me);
    },
    []
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
