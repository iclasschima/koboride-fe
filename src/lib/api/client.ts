const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const TOKEN_KEY = "koboride.token";
const USER_KEY = "koboride.user";
const ADMIN_TOKEN_KEY = "koboride.adminToken";

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

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): { id: string; phone: string; name: string | null } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as { id: string; phone: string; name: string | null }) : null;
  } catch {
    return null;
  }
}

export function setSession(token: string | null, user: { id: string; phone: string; name: string | null } | null) {
  if (typeof window === "undefined") return;
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
  if (!user) localStorage.removeItem(USER_KEY);
  else localStorage.setItem(USER_KEY, JSON.stringify(user));
}

async function adminToken(): Promise<string> {
  if (typeof window === "undefined") throw new ApiError("Not signed in", 401);
  const existing = sessionStorage.getItem(ADMIN_TOKEN_KEY);
  if (existing) return existing;
  const email = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "admin@koboride.ng";
  const password = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "ChangeMeNow!";
  const data = await request<{ token: string }>("/api/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    token: null,
  });
  sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
  return data.token;
}

type RequestOpts = RequestInit & { token?: string | null; admin?: boolean; _adminRetry?: boolean };

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { token: tokenOpt, admin, _adminRetry, headers, ...init } = opts;
  let token = tokenOpt;
  if (admin) token = await adminToken();
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
    if (admin && res.status === 401 && !_adminRetry && typeof window !== "undefined") {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      return request<T>(path, { ...opts, _adminRetry: true });
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
};
