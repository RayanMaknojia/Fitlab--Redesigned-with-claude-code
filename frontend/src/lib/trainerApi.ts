// Trainer-side API — real fetch calls against the Express backend.
// Owned by: Jiachen Sun (trainer-client management).
//
// Auth is the session cookie (credentials: "include"), so there's no token
// plumbing here; the logged-in trainer is resolved server-side.

import type {
  ClientSummary,
  ClientSyncData,
  LinkRequest,
  SyncedExercise,
  TrainerScheduleEntry,
} from "@/types"

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

/** GET /api/trainers/me/clients — linked clients with a session summary. */
export async function getClients(): Promise<ClientSummary[]> {
  return request("/trainers/me/clients")
}

/** GET /api/trainers/me/link-requests — pending requests, both directions. */
export async function getRequests(): Promise<LinkRequest[]> {
  return request("/trainers/me/link-requests")
}

/** POST /api/trainers/me/link-requests — send a link request to a client by email. */
export async function sendLinkRequest(email: string): Promise<LinkRequest> {
  return request("/trainers/me/link-requests", {
    method: "POST",
    body: JSON.stringify({ client_email: email }),
  })
}

/** POST /api/trainers/me/link-requests/:id/accept — accept a client-initiated request. */
export async function acceptRequest(requestId: string): Promise<LinkRequest> {
  return request(`/trainers/me/link-requests/${requestId}/accept`, {
    method: "POST",
  })
}

/** POST /api/trainers/me/link-requests/:id/decline */
export async function declineRequest(requestId: string): Promise<LinkRequest> {
  return request(`/trainers/me/link-requests/${requestId}/decline`, {
    method: "POST",
  })
}

/** DELETE /api/trainers/me/clients/:id — unlink a client. */
export async function unlinkClient(clientId: string): Promise<void> {
  return request(`/trainers/me/clients/${clientId}`, { method: "DELETE" })
}

/**
 * GET /api/trainers/me/clients/:id/sync — full live payload for one linked
 * client: profile, session history with exercises, and progress stats.
 * Reads are live (no snapshot), so client updates appear on every fetch.
 */
export async function syncClient(clientId: string): Promise<ClientSyncData> {
  return request(`/trainers/me/clients/${clientId}/sync`)
}

// --- workout-session editing for linked clients ---
// These use the shared /clients + /workout-sessions routes; the backend
// grants access because the logged-in trainer is linked to the client.

/** POST /api/clients/:clientId/workout-sessions — log a session for the client. */
export async function addWorkoutSession(
  clientId: string,
  sessionDate: string,
): Promise<{ _id: string }> {
  return request(`/clients/${clientId}/workout-sessions`, {
    method: "POST",
    body: JSON.stringify({ session_date: sessionDate }),
  })
}

/** DELETE /api/workout-sessions/:sessionId */
export async function deleteWorkoutSession(sessionId: string): Promise<void> {
  return request(`/workout-sessions/${sessionId}`, { method: "DELETE" })
}

/** POST /api/workout-sessions/:sessionId/exercises */
export async function addSessionExercise(
  sessionId: string,
  input: {
    exercise_template_id: string
    sets: number
    reps: number
    weight_in_kg: number
  },
): Promise<SyncedExercise> {
  return request(`/workout-sessions/${sessionId}/exercises`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

/** PUT /api/workout-sessions/:sessionId/exercises/:exerciseId */
export async function updateSessionExercise(
  sessionId: string,
  exerciseId: string,
  input: { sets: number; reps: number; weight_in_kg: number },
): Promise<void> {
  await request(`/workout-sessions/${sessionId}/exercises/${exerciseId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

/** DELETE /api/workout-sessions/:sessionId/exercises/:exerciseId */
export async function deleteSessionExercise(
  sessionId: string,
  exerciseId: string,
): Promise<void> {
  return request(`/workout-sessions/${sessionId}/exercises/${exerciseId}`, {
    method: "DELETE",
  })
}

/** GET /api/clients/:clientId/exercise-templates — the client's exercise library. */
export async function getClientTemplates(
  clientId: string,
): Promise<{ _id: string; name: string }[]> {
  return request(`/clients/${clientId}/exercise-templates`)
}

/** POST /api/clients/:clientId/exercise-templates — add to the client's library. */
export async function addClientTemplate(
  clientId: string,
  name: string,
): Promise<{ _id: string; name: string }> {
  return request(`/clients/${clientId}/exercise-templates`, {
    method: "POST",
    body: JSON.stringify({ name }),
  })
}

/** GET /api/trainers/me/schedules — merged calendar across linked clients. */
export async function getScheduleEvents(): Promise<TrainerScheduleEntry[]> {
  return request("/trainers/me/schedules")
}

/** POST /api/clients/:clientId/schedules — book a session for a linked client. */
export async function addSchedule(
  clientId: string,
  input: { start_time: string; duration_in_minutes: number },
): Promise<void> {
  await request(`/clients/${clientId}/schedules`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

/** DELETE /api/schedules/:scheduleId — cancel a session. */
export async function deleteSchedule(scheduleId: string): Promise<void> {
  return request(`/schedules/${scheduleId}`, { method: "DELETE" })
}

/**
 * POST /api/trainers/me/schedules/:id/reschedule-request — propose a new
 * slot; the client accepts (schedule moves) or declines.
 */
export async function requestReschedule(
  scheduleId: string,
  input: {
    proposed_start_time: string
    proposed_duration_in_minutes: number
    message?: string
  },
): Promise<void> {
  await request(`/trainers/me/schedules/${scheduleId}/reschedule-request`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}
