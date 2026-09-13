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
  photoUrl?: string | null;
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

function readPersisted(key: string): string | null {
  if (typeof window === "undefined") return null;
  const local = localStorage.getItem(key);
  if (local) return local;
  const session = sessionStorage.getItem(key);
  if (session) {
    localStorage.setItem(key, session);
    sessionStorage.removeItem(key);
  }
  return session;
}

function writePersisted(key: string, value: string | null): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(key);
  if (!value) localStorage.removeItem(key);
  else localStorage.setItem(key, value);
}

function readUser(key: string): SessionUser | null {
  const raw = readPersisted(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return readPersisted(TOKEN_KEY);
}

export function getStoredUser(): SessionUser | null {
  return readUser(USER_KEY);
}

export function setSession(token: string | null, user: SessionUser | null) {
  writePersisted(TOKEN_KEY, token);
  writePersisted(USER_KEY, user ? JSON.stringify(user) : null);
}

export function getRiderToken(): string | null {
  return readPersisted(RIDER_TOKEN_KEY);
}

export function getStoredRiderUser(): SessionUser | null {
  return readUser(RIDER_USER_KEY);
}

export function setRiderSession(token: string | null, user: SessionUser | null) {
  writePersisted(RIDER_TOKEN_KEY, token);
  writePersisted(RIDER_USER_KEY, user ? JSON.stringify(user) : null);
}

export function getAdminToken(): string | null {
  return readPersisted(ADMIN_TOKEN_KEY);
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
  writePersisted(ADMIN_TOKEN_KEY, data.token);
}

export function logoutCustomer() {
  setSession(null, null);
}

export function logoutRider() {
  setRiderSession(null, null);
}

export function logoutAdmin() {
  writePersisted(ADMIN_TOKEN_KEY, null);
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

  const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
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
        writePersisted(ADMIN_TOKEN_KEY, null);
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
  postForm: <T>(path: string, body: FormData, opts?: RequestOpts) =>
    request<T>(path, {
      ...opts,
      method: "POST",
      body,
      headers: { ...(opts?.headers ?? {}) },
    }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOpts) =>
    request<T>(path, { ...opts, method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) }),
  patchForm: <T>(path: string, body: FormData, opts?: RequestOpts) =>
    request<T>(path, {
      ...opts,
      method: "PATCH",
      body,
      headers: { ...(opts?.headers ?? {}) },
    }),
  delete: <T>(path: string, opts?: RequestOpts) =>
    request<T>(path, { ...opts, method: "DELETE" }),
};
