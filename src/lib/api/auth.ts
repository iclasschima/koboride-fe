import { api, getStoredUser, getToken, logoutCustomer, setSession } from "@/lib/api/client";
import type { User } from "@/types/user";

export type OtpRequest = {
  expires_in_seconds: number;
  devCode?: string;
};

export async function requestOtp(phone: string): Promise<OtpRequest> {
  return api.post<OtpRequest>("/api/auth/otp/request", { phone }, { token: null });
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
  setSession(getToken(), data.user);
  return data.user;
}

export async function logout() {
  logoutCustomer();
}

export function getStoredSession(): { user: User | null; token: string | null } {
  return { user: getStoredUser(), token: getToken() };
}
