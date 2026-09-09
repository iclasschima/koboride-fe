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
  getStoredSession,
  logout as apiLogout,
  requestOtp,
  updateProfile,
  verifyOtp,
} from "@/lib/api/auth";
import type { User } from "@/types/user";

type AuthMode = "login" | "profile" | null;

type AuthContextValue = {
  ready: boolean;
  authenticated: boolean;
  user: User | null;
  authOpen: AuthMode;
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
  sendOtp: (phone: string) => Promise<{
    expires_in_seconds?: number;
    devCode?: string;
    token?: string;
    user?: User;
  }>;
  verify: (phone: string, code: string) => Promise<User>;
  saveProfile: (input: { name: string }) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState<AuthMode>(null);

  useEffect(() => {
    try {
      const session = getStoredSession();
      setUser(session.user);
      setToken(session.token);
    } finally {
      setReady(true);
    }
  }, []);

  const openAuth = useCallback((mode: AuthMode = "login") => {
    setAuthOpen(mode);
  }, []);

  const closeAuth = useCallback(() => setAuthOpen(null), []);

  const sendOtp = useCallback(async (phone: string) => {
    const result = await requestOtp(phone);
    if (result.token && result.user) {
      setUser(result.user);
      setToken(result.token);
      if (!result.user.name) setAuthOpen("profile");
      else setAuthOpen(null);
    }
    return result;
  }, []);

  const verify = useCallback(async (phone: string, code: string) => {
    const next = await verifyOtp(phone, code);
    setUser(next);
    setToken(getStoredSession().token);
    if (!next.name) setAuthOpen("profile");
    else setAuthOpen(null);
    return next;
  }, []);

  const saveProfile = useCallback(async (input: { name: string }) => {
    const next = await updateProfile(input);
    setUser(next);
    setAuthOpen(null);
    return next;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      authenticated: Boolean(token && user),
      user,
      authOpen,
      openAuth,
      closeAuth,
      sendOtp,
      verify,
      saveProfile,
      logout,
    }),
    [
      ready,
      token,
      user,
      authOpen,
      openAuth,
      closeAuth,
      sendOtp,
      verify,
      saveProfile,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
