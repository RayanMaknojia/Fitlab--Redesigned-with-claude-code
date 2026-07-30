const API_BASE = "http://localhost:3000/api";

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  // 204 No Content has no body — calling .json() on it throws, since there's
  // nothing to parse.
  const data = res.status === 204 ? null : await res.json();

  if (!res.ok) {
    throw new Error(data?.error ?? "Request failed");
  }

  return data as T;
}
