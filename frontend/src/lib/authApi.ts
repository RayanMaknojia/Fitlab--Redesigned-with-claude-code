import { request } from "@/lib/request";

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: "client" | "trainer";
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

  // NOTE: backend endpoint not implemented yet (auth team) — expects
  // POST /auth/change-password { currentPassword, newPassword }.
  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    request<{ ok: boolean }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
