import { api, getStoredUser, getToken, setSession } from "@/lib/api/client";
import type { User } from "@/types/user";

export async function requestOtp(phone: string) {
  const data = await api.post<{
    expires_in_seconds?: number;
    devCode?: string;
    token?: string;
    user?: User;
  }>("/api/auth/otp/request", { phone }, { token: null });
  if (data.token && data.user) setSession(data.token, data.user);
  return data;
}

export async function verifyOtp(phone: string, code: string): Promise<User> {
  const data = await api.post<{ token: string; user: User }>(
    "/api/auth/otp/verify",
    { phone, code },
    { token: null },
  );
  setSession(data.token, data.user);
  return data.user;
}

export async function updateProfile(input: { name: string }): Promise<User> {
  const data = await api.patch<{ user: User }>("/api/auth/me", input);
  const token = getToken();
  setSession(token, data.user);
  return data.user;
}

export async function logout() {
  setSession(null, null);
  if (typeof window !== "undefined") sessionStorage.removeItem("koboride.adminToken");
}

export function getStoredSession(): { user: User | null; token: string | null } {
  return { user: getStoredUser(), token: getToken() };
}
