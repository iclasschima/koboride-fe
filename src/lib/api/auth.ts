import { api, getStoredUser, getToken, loginCustomer, logoutCustomer, setSession } from "@/lib/api/client";
import type { User } from "@/types/user";

export async function signIn(phone: string): Promise<User> {
  const data = await loginCustomer(phone);
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
