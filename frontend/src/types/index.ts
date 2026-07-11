// Shared FitLab types — mirrors the DB entities in the project README.
// Owned by: Jiachen Sun (trainer-client management). Extend, don't break.

export type Role = "client" | "trainer"

export interface Exercise {
  name: string
  sets: number
  reps: number
  weight_in_kg: number | null
}

export interface WorkoutSession {
  session_id: string
  client_id: string
  exercises: Exercise[]
  session_date: string // ISO date
}

export interface Schedule {
  client_id: string
  trainer_id: string
  start_time: string // ISO datetime
  duration: number // minutes
}

/** A client as seen from the trainer's dashboard. */
export interface Client {
  client_id: string
  name: string
  email: string
  goal?: string
  linked_at: string // ISO date
  workout_sessions: WorkoutSession[]
  schedules: Schedule[]
}

/** A schedule entry joined with client info, for the trainer's calendar. */
export interface ScheduleEvent extends Schedule {
  client_name: string
  /** stable index used for per-client color coding */
  client_index: number
}

/** A trainer-initiated request to move a training session. */
export interface RescheduleRequest {
  request_id: string
  client_id: string
  original_start: string // ISO datetime of the session to move
  proposed_start: string | null // ISO datetime, null = "any time"
  reason: string
  status: "pending" | "accepted" | "declined"
  created_at: string
}

export type LinkRequestStatus = "pending" | "accepted" | "declined"

/** A connection request between a trainer and a client. */
export interface LinkRequest {
  request_id: string
  direction: "incoming" | "outgoing" // incoming = client asked to join you
  client_id: string
  client_name: string
  client_email: string
  status: LinkRequestStatus
  created_at: string
}
