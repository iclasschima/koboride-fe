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
  signIn,
  updateProfile,
} from "@/lib/api/auth";
import { api, setSession } from "@/lib/api/client";
import type { User } from "@/types/user";

type AuthMode = "login" | "profile" | null;

type AuthContextValue = {
  ready: boolean;
  authenticated: boolean;
  user: User | null;
  authOpen: AuthMode;
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
  login: (phone: string) => Promise<User>;
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
    const session = getStoredSession();
    setUser(session.user);
    setToken(session.token);
    setReady(true);
    if (!session.token) return;
    void api
      .get<{ user: User }>("/api/auth/me")
      .then((data) => {
        setUser(data.user);
        setSession(session.token, data.user);
      })
      .catch(() => {
        /* keep the stored session */
      });
  }, []);

  const openAuth = useCallback((mode: AuthMode = "login") => {
    setAuthOpen(mode);
  }, []);

  const closeAuth = useCallback(() => setAuthOpen(null), []);

  const login = useCallback(async (phone: string) => {
    const next = await signIn(phone);
    setUser(next);
    setToken(getStoredSession().token);
    if (next.isRider || next.name) setAuthOpen(null);
    else setAuthOpen("profile");
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
      authenticated: Boolean(token),
      user,
      authOpen,
      openAuth,
      closeAuth,
      login,
      saveProfile,
      logout,
    }),
    [ready, token, user, authOpen, openAuth, closeAuth, login, saveProfile, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
