const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const TOKEN_KEY = "koboride.token";
const USER_KEY = "koboride.user";
const RIDER_TOKEN_KEY = "koboride.riderToken";
const RIDER_USER_KEY = "koboride.riderUser";
const ADMIN_TOKEN_KEY = "koboride.opsToken";

export type SessionUser = {
  id: string;
  phone: string;
  name: string | null;
  isRider?: boolean;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function readUser(key: string): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): SessionUser | null {
  return readUser(USER_KEY);
}

export function setSession(token: string | null, user: SessionUser | null) {
  if (typeof window === "undefined") return;
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
  if (!user) localStorage.removeItem(USER_KEY);
  else localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getRiderToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(RIDER_TOKEN_KEY);
}

export function getStoredRiderUser(): SessionUser | null {
  return readUser(RIDER_USER_KEY);
}

export function setRiderSession(token: string | null, user: SessionUser | null) {
  if (typeof window === "undefined") return;
  if (!token) localStorage.removeItem(RIDER_TOKEN_KEY);
  else localStorage.setItem(RIDER_TOKEN_KEY, token);
  if (!user) localStorage.removeItem(RIDER_USER_KEY);
  else localStorage.setItem(RIDER_USER_KEY, JSON.stringify(user));
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export async function loginCustomer(
  phone: string,
  name?: string,
): Promise<{ token: string; user: SessionUser }> {
  const data = await request<{ token: string; user: SessionUser }>("/api/auth/customer/login", {
    method: "POST",
    body: JSON.stringify({ phone, ...(name ? { name } : {}) }),
    token: null,
  });
  setSession(data.token, data.user);
  return data;
}

export async function loginRider(
  phone: string,
): Promise<{ token: string; user: SessionUser; rider: { id: string; approved: boolean; online: boolean } }> {
  const data = await request<{
    token: string;
    user: SessionUser;
    rider: { id: string; approved: boolean; online: boolean };
  }>("/api/auth/rider/login", {
    method: "POST",
    body: JSON.stringify({ phone }),
    token: null,
  });
  setRiderSession(data.token, data.user);
  return data;
}

export async function loginAdmin(email: string, password: string): Promise<void> {
  const data = await request<{ token: string }>("/api/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    token: null,
  });
  sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
}

export function logoutCustomer() {
  setSession(null, null);
}

export function logoutRider() {
  setRiderSession(null, null);
}

export function logoutAdmin() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function adminToken(): Promise<string> {
  const existing = getAdminToken();
  if (!existing) throw new ApiError("Not signed in", 401);
  return existing;
}

async function riderToken(): Promise<string> {
  const existing = getRiderToken();
  if (!existing) throw new ApiError("Not signed in", 401);
  return existing;
}

type RequestOpts = RequestInit & {
  token?: string | null;
  admin?: boolean;
  rider?: boolean;
};

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { token: tokenOpt, admin, rider, headers, ...init } = opts;
  let token = tokenOpt;
  if (admin) token = await adminToken();
  else if (rider) token = await riderToken();
  else if (token === undefined) token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
  } & T;

  if (!res.ok) {
    if (typeof window !== "undefined" && res.status === 401) {
      if (admin) {
        sessionStorage.removeItem(ADMIN_TOKEN_KEY);
        const here = window.location.pathname;
        if (here.startsWith("/admin") && here !== "/admin/login") {
          window.location.replace("/admin/login");
        }
      } else if (rider) {
        setRiderSession(null, null);
        const here = window.location.pathname;
        if (here.startsWith("/rider") && here !== "/rider/login") {
          window.location.replace("/rider/login");
        }
      }
    }
    throw new ApiError(data.error ?? "Request failed", res.status, data.code);
  }
  return data;
}

export const api = {
  get: <T>(path: string, opts?: RequestOpts) => request<T>(path, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOpts) =>
    request<T>(path, { ...opts, method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOpts) =>
    request<T>(path, { ...opts, method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T>(path: string, opts?: RequestOpts) =>
    request<T>(path, { ...opts, method: "DELETE" }),
};
