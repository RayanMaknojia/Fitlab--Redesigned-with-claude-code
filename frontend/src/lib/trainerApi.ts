// Mock API for the trainer dashboard.
// Owned by: Jiachen Sun (trainer-client management).
//
// Every function here matches the shape of a future REST endpoint
// (commented above each one). When the Express backend is ready, replace
// the bodies with fetch() calls — the components won't need to change.
//
// State persists in localStorage so the demo survives refreshes.
// By default the trainer has NO clients (per spec); a few mock "registered
// FitLab users" exist in a directory you can send link requests to, and one
// incoming request is seeded so the accept/decline flow can be demoed.

import type {
  Client,
  LinkRequest,
  RescheduleRequest,
  Schedule,
  ScheduleEvent,
  WorkoutSession,
} from "@/types"

const STORE_KEY = "fitlab.trainer.mock.v1"
const TRAINER_ID = "t-me" // TODO: from auth context
const LATENCY = 450 // simulated network delay (ms)

interface Store {
  clients: Client[]
  requests: LinkRequest[]
  reschedules?: RescheduleRequest[]
}

// --- mock directory of registered client accounts (would live in the DB) ---

interface DirectoryEntry {
  client_id: string
  name: string
  email: string
  goal: string
}

const DIRECTORY: DirectoryEntry[] = [
  { client_id: "c-001", name: "Maya Chen", email: "maya@fitlab.dev", goal: "Strength" },
  { client_id: "c-002", name: "Leo Park", email: "leo@fitlab.dev", goal: "Hypertrophy" },
  { client_id: "c-003", name: "Sofia Reyes", email: "sofia@fitlab.dev", goal: "Weight loss" },
  { client_id: "c-004", name: "Noah Kim", email: "noah@fitlab.dev", goal: "Endurance" },
  { client_id: "c-005", name: "Ava Patel", email: "ava@fitlab.dev", goal: "Mobility" },
]

function makeSessions(clientId: string, count: number): WorkoutSession[] {
  const exercises = [
    { name: "Back Squat", sets: 4, reps: 6, weight_in_kg: 80 },
    { name: "Bench Press", sets: 3, reps: 8, weight_in_kg: 60 },
    { name: "Deadlift", sets: 3, reps: 5, weight_in_kg: 100 },
    { name: "Pull Ups", sets: 3, reps: 10, weight_in_kg: null },
  ]
  return Array.from({ length: count }, (_, i) => ({
    session_id: `${clientId}-s${i}`,
    client_id: clientId,
    exercises: exercises.slice(0, 2 + ((i + clientId.length) % 3)),
    session_date: new Date(Date.now() - i * 3 * 86400_000).toISOString(),
  }))
}

/**
 * Deterministic weekly training slots per client: 1-2 sessions/week on fixed
 * weekdays, generated from ~2 weeks back to ~6 weeks ahead.
 */
function makeSchedules(clientId: string): Schedule[] {
  const code = clientId.charCodeAt(clientId.length - 1)
  const slots: { dow: number; hour: number; minute: number }[] = [
    { dow: 1 + (code % 5), hour: [7, 9, 15, 17, 18][code % 5], minute: code % 2 ? 30 : 0 },
  ]
  if (code % 2 === 0) {
    slots.push({ dow: 1 + ((code + 3) % 5), hour: [8, 10, 16, 18, 19][(code + 2) % 5], minute: 0 })
  }
  const schedules: Schedule[] = []
  const day = new Date()
  day.setHours(0, 0, 0, 0)
  day.setDate(day.getDate() - 14)
  for (let i = 0; i < 60; i++) {
    for (const slot of slots) {
      if (day.getDay() === slot.dow) {
        const start = new Date(day)
        start.setHours(slot.hour, slot.minute, 0, 0)
        schedules.push({
          client_id: clientId,
          trainer_id: TRAINER_ID,
          start_time: start.toISOString(),
          duration: 60,
        })
      }
    }
    day.setDate(day.getDate() + 1)
  }
  return schedules
}

// --- storage helpers ---

function seed(): Store {
  return {
    clients: [], // default: no linked clients
    requests: [
      {
        request_id: "r-seed-1",
        direction: "incoming",
        client_id: "c-003",
        client_name: "Sofia Reyes",
        client_email: "sofia@fitlab.dev",
        status: "pending",
        created_at: new Date(Date.now() - 2 * 86400_000).toISOString(),
      },
    ],
  }
}

function load(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) return JSON.parse(raw) as Store
  } catch {
    /* fall through to seed */
  }
  const s = seed()
  save(s)
  return s
}

function save(s: Store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(s))
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY))
}

function toClient(entry: DirectoryEntry): Client {
  return {
    client_id: entry.client_id,
    name: entry.name,
    email: entry.email,
    goal: entry.goal,
    linked_at: new Date().toISOString(),
    workout_sessions: makeSessions(entry.client_id, 3 + (entry.client_id.charCodeAt(4) % 5)),
    schedules: makeSchedules(entry.client_id),
  }
}

// --- API surface (future REST endpoints noted above each) ---

/** GET /api/trainers/me/clients */
export async function getClients(): Promise<Client[]> {
  return delay(load().clients)
}

/** GET /api/trainers/me/requests */
export async function getRequests(): Promise<LinkRequest[]> {
  return delay(load().requests.filter((r) => r.status === "pending"))
}

/**
 * POST /api/trainers/me/requests  { client_email }
 * Sends a link request to a registered client by email.
 */
export async function sendLinkRequest(email: string): Promise<LinkRequest> {
  const store = load()
  const normalized = email.trim().toLowerCase()
  const entry = DIRECTORY.find((d) => d.email === normalized)
  if (!entry) {
    await delay(undefined)
    throw new Error("No FitLab client found with that email.")
  }
  if (store.clients.some((c) => c.client_id === entry.client_id)) {
    throw new Error(`${entry.name} is already your client.`)
  }
  if (
    store.requests.some(
      (r) => r.client_id === entry.client_id && r.status === "pending"
    )
  ) {
    throw new Error(`A request for ${entry.name} is already pending.`)
  }
  const request: LinkRequest = {
    request_id: `r-${crypto.randomUUID()}`,
    direction: "outgoing",
    client_id: entry.client_id,
    client_name: entry.name,
    client_email: entry.email,
    status: "pending",
    created_at: new Date().toISOString(),
  }
  store.requests.push(request)
  save(store)

  // Mock: the client "accepts" a few seconds later.
  setTimeout(() => acceptRequest(request.request_id).catch(() => {}), 4000)

  return delay(request)
}

/** POST /api/trainers/me/requests/:id/accept */
export async function acceptRequest(requestId: string): Promise<Client> {
  const store = load()
  const req = store.requests.find((r) => r.request_id === requestId)
  if (!req || req.status !== "pending") throw new Error("Request not found.")
  req.status = "accepted"
  const entry = DIRECTORY.find((d) => d.client_id === req.client_id)
  const client = entry
    ? toClient(entry)
    : {
        client_id: req.client_id,
        name: req.client_name,
        email: req.client_email,
        linked_at: new Date().toISOString(),
        workout_sessions: [],
        schedules: [],
      }
  if (!store.clients.some((c) => c.client_id === client.client_id)) {
    store.clients.push(client)
  }
  save(store)
  return delay(client)
}

/** POST /api/trainers/me/requests/:id/decline */
export async function declineRequest(requestId: string): Promise<void> {
  const store = load()
  const req = store.requests.find((r) => r.request_id === requestId)
  if (req) req.status = "declined"
  save(store)
  return delay(undefined)
}

/** DELETE /api/trainers/me/clients/:id */
export async function unlinkClient(clientId: string): Promise<void> {
  const store = load()
  store.clients = store.clients.filter((c) => c.client_id !== clientId)
  store.requests = store.requests.filter((r) => r.client_id !== clientId)
  save(store)
  return delay(undefined)
}

/**
 * GET /api/trainers/me/schedules
 * All scheduled sessions across linked clients, joined with client names.
 * Lazily backfills schedules for clients linked before this feature existed.
 */
export async function getScheduleEvents(): Promise<ScheduleEvent[]> {
  const store = load()
  let dirty = false
  for (const client of store.clients) {
    if (client.schedules.length === 0) {
      client.schedules = makeSchedules(client.client_id)
      dirty = true
    }
  }
  if (dirty) save(store)

  const events = store.clients.flatMap((client, index) =>
    client.schedules.map((s) => ({
      ...s,
      client_name: client.name,
      client_index: index,
    }))
  )
  events.sort((a, b) => a.start_time.localeCompare(b.start_time))
  return delay(events)
}

/**
 * POST /api/trainers/me/reschedule-requests
 * Asks a client to move a session. Backend/client-approval flow comes later —
 * for now the request is just stored as pending.
 */
export async function requestReschedule(input: {
  client_id: string
  original_start: string
  proposed_start: string | null
  reason: string
}): Promise<RescheduleRequest> {
  const store = load()
  const request: RescheduleRequest = {
    request_id: `rs-${crypto.randomUUID()}`,
    ...input,
    status: "pending",
    created_at: new Date().toISOString(),
  }
  store.reschedules = [...(store.reschedules ?? []), request]
  save(store)
  return delay(request)
}

/** GET /api/trainers/me/reschedule-requests */
export async function getRescheduleRequests(): Promise<RescheduleRequest[]> {
  return delay(load().reschedules ?? [])
}

/** Demo helper: reset mock data back to the empty default. */
export function resetMockData(): void {
  localStorage.removeItem(STORE_KEY)
}

/** Emails that exist in the mock directory (shown as hints in the UI). */
export const DEMO_EMAILS = DIRECTORY.map((d) => d.email)
