import type { FieldErrors } from "@conduit/contracts";

export const TOKEN_KEY = "jwtToken";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly errors: FieldErrors,
  ) {
    super(Object.entries(errors).flatMap(([field, messages]) => messages.map((message) => `${field} ${message}`)).join("; "));
  }
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body != null) headers.set("content-type", "application/json");
  const token = getToken();
  if (token) headers.set("authorization", `Token ${token}`);

  const response = await fetch(path, { ...init, headers });
  if (response.status === 204) return undefined as T;
  const payload = (await response.json().catch(() => null)) as { errors?: FieldErrors } | null;
  if (!response.ok) {
    throw new ApiError(response.status, payload?.errors ?? { server: ["internal error"] });
  }
  return payload as T;
}
