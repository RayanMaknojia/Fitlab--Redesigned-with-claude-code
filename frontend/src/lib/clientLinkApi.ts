// Client-side linking API — the client's half of the trainer↔client
// linking flow: see who you're linked with, send a request to a trainer
// by email, respond to trainer-initiated requests, and unlink.
// Owned by: Jiachen Sun (trainer-client management).

import type { LinkedTrainer, LinkRequest } from "@/types"

const API_BASE = "http://localhost:3000/api"

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  })

  if (res.status === 204) {
    return undefined as T
  }

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error ?? "Request failed")
  }

  return data as T
}

/** GET /api/clients/me/trainer — the linked trainer, or null. */
export async function getMyTrainer(): Promise<LinkedTrainer | null> {
  const { trainer } = await request<{ trainer: LinkedTrainer | null }>(
    "/clients/me/trainer",
  )
  return trainer
}

/** GET /api/clients/me/link-requests — pending requests, both directions. */
export async function getMyLinkRequests(): Promise<LinkRequest[]> {
  return request("/clients/me/link-requests")
}

/** POST /api/clients/me/link-requests — send a link request to a trainer by email. */
export async function sendLinkRequestToTrainer(
  email: string,
): Promise<LinkRequest> {
  return request("/clients/me/link-requests", {
    method: "POST",
    body: JSON.stringify({ trainer_email: email }),
  })
}

/** POST /api/clients/me/link-requests/:id/accept — accept a trainer's request. */
export async function acceptLinkRequest(
  requestId: string,
): Promise<LinkRequest> {
  return request(`/clients/me/link-requests/${requestId}/accept`, {
    method: "POST",
  })
}

/** POST /api/clients/me/link-requests/:id/decline */
export async function declineLinkRequest(
  requestId: string,
): Promise<LinkRequest> {
  return request(`/clients/me/link-requests/${requestId}/decline`, {
    method: "POST",
  })
}

/** DELETE /api/clients/me/trainer — unlink from your trainer. */
export async function unlinkMyTrainer(): Promise<void> {
  return request("/clients/me/trainer", { method: "DELETE" })
}
