"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getStoredRiderUser,
  getRiderToken,
  loginRider as apiLoginRider,
  logoutRider as apiLogoutRider,
} from "@/lib/api/client";
import type { User } from "@/types/user";

type RiderAuthContextValue = {
  ready: boolean;
  authenticated: boolean;
  user: User | null;
  login: (phone: string) => Promise<User>;
  logout: () => void;
};

const RiderAuthContext = createContext<RiderAuthContextValue | null>(null);

export function RiderAuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      setUser(getStoredRiderUser());
      setToken(getRiderToken());
    } finally {
      setReady(true);
    }
  }, []);

  const login = useCallback(async (phone: string) => {
    const result = await apiLoginRider(phone);
    setUser(result.user);
    setToken(result.token);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    apiLogoutRider();
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      authenticated: Boolean(token && user),
      user,
      login,
      logout,
    }),
    [ready, token, user, login, logout],
  );

  return <RiderAuthContext.Provider value={value}>{children}</RiderAuthContext.Provider>;
}

export function useRiderAuth() {
  const ctx = useContext(RiderAuthContext);
  if (!ctx) throw new Error("useRiderAuth must be used within RiderAuthProvider");
  return ctx;
}
