import { request } from "@/lib/request"

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: "client" | "trainer";
}

// Named actions the rest of the frontend can call.
export const api = {
  // Create a new account.
  register: (input: { name: string; email: string; password: string; role: "client" | "trainer" }) =>
    request<{ name: string; email: string; role: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  // Log in and receive the current user.
  login: (input: { email: string; password: string; rememberMe?: boolean }) =>
    request<{ user: ApiUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  // Log out and clear the current session.
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),

  // Ask the backend who is currently logged in.
  me: () => request<{ user: ApiUser }>("/auth/me"),
};
