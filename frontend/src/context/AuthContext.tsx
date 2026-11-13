import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type ApiUser } from "@/lib/authApi";
import { clearSessionsCache } from "@/lib/clientApi";

interface AuthContextValue {
  user: ApiUser | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    const { user } = await api.login({ email, password, rememberMe });
    // Per-user data is cached at module level (clientApi's sessionsCache).
    // Clear it before the new user's pages render, or they would be served
    // the previous user's sessions in the same tab. This must happen here,
    // synchronously, not in an effect: child effects (e.g. the dashboard's
    // fetch) run before a parent's effect would.
    clearSessionsCache();
    setUser(user);
  };

  const logout = async () => {
    // Drop the outgoing user's cached data even if the logout request fails.
    clearSessionsCache();
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
