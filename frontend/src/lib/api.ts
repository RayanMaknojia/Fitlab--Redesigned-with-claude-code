import type { ChatRequestMessage } from "@/components/chatbot/types"

// All frontend requests go through the local backend first.
const API_BASE = "http://localhost:3000/api";

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: "client" | "trainer";
}

export interface ChatResponse {
  message: {
    role: "assistant";
    content: string;
  };
}

// Shared request helper so components do not have to repeat fetch setup.
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    // Include the session cookie for login-protected routes.
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

  // Send chat history to the backend and get one AI reply back.
  chat: (input: { messages: ChatRequestMessage[] }) =>
    request<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
