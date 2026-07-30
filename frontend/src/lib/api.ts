import type { WorkoutSession } from "@/types";

const API_BASE = "http://localhost:3000/api";

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: "client" | "trainer";
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? "Request failed");
  }

  return data;
}

export const api = {
  register: (input: { name: string; email: string; password: string; role: "client" | "trainer" }) =>
    request<{ name: string; email: string; role: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  login: (input: { email: string; password: string; rememberMe?: boolean }) =>
    request<{ user: ApiUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),

  me: () => request<{ user: ApiUser }>("/auth/me"),

  forgotPassword: (input: { email: string }) =>
    request<{ ok: boolean }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  resetPassword: (input: { token: string; password: string }) =>
    request<{ ok: boolean }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  getMyWorkoutSessions: () => request<WorkoutSession[]>("/me/workout-sessions"),
};
