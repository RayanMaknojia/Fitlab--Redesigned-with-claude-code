// All frontend requests go through the local backend first.
const API_BASE = "http://localhost:3000/api"

// Shared request helper so feature API files do not have to repeat fetch setup.
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    // Include the session cookie for login-protected routes.
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error ?? "Request failed")
  }

  return data
}

export { request }
