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
  api,
  getStoredRiderUser,
  getRiderToken,
  loginRider as apiLoginRider,
  logoutRider as apiLogoutRider,
  setRiderSession,
} from "@/lib/api/client";
import type { User } from "@/types/user";

type RiderAuthContextValue = {
  ready: boolean;
  authenticated: boolean;
  user: User | null;
  login: (phone: string) => Promise<User>;
  updateUser: (patch: Partial<User>) => void;
  logout: () => void;
};

const RiderAuthContext = createContext<RiderAuthContextValue | null>(null);

export function RiderAuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const token = getRiderToken();
    try {
      setUser(getStoredRiderUser());
      setToken(token);
    } finally {
      setReady(true);
    }
    if (!token) return;
    void api
      .get<{ user: User }>("/api/auth/me", { rider: true })
      .then((data) => {
        setUser(data.user);
        setRiderSession(token, data.user);
      })
      .catch(() => {
        /* keep the stored session if /me fails */
      });
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

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      setRiderSession(getRiderToken(), next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      ready,
      authenticated: Boolean(token && user),
      user,
      login,
      updateUser,
      logout,
    }),
    [ready, token, user, login, updateUser, logout],
  );

  return <RiderAuthContext.Provider value={value}>{children}</RiderAuthContext.Provider>;
}

export function useRiderAuth() {
  const ctx = useContext(RiderAuthContext);
  if (!ctx) throw new Error("useRiderAuth must be used within RiderAuthProvider");
  return ctx;
}
