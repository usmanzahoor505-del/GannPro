import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api, User, SubscriptionStatus } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  subscription: SubscriptionStatus | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSubscription = useCallback(async () => {
    if (!user || user.role === "admin") return;
    try {
      const status = await api.getSubscriptionStatus();
      setSubscription(status);
    } catch {
      setSubscription(null);
    }
  }, [user]);

  const refreshUser = useCallback(async () => {
    try {
      const { user: u } = await api.me();
      setUser(u);
    } catch {
      setUser(null);
      setSubscription(null);
    }
  }, []);

  useEffect(() => {
    api.me()
      .then(({ user: u }) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user && user.role === "user") {
      refreshSubscription();
      const interval = setInterval(refreshSubscription, 30000);
      return () => clearInterval(interval);
    }
  }, [user, refreshSubscription]);

  const login = async (email: string, password: string) => {
    const { user: u } = await api.login({ email, password });
    setUser(u);
    if (u.role === "user") await refreshSubscription();
  };

  const adminLogin = async (email: string, password: string) => {
    const { user: u } = await api.adminLogin({ email, password });
    setUser(u);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setSubscription(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        loading,
        login,
        adminLogin,
        logout,
        refreshUser,
        refreshSubscription,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
