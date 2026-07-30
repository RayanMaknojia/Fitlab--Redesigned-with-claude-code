// Shared FitLab types — mirrors the shapes the Express backend returns.
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

/**
 * A linked client as returned by GET /api/trainers/me/clients
 * (dataSyncupService.ClientSummary).
 */
export interface ClientSummary {
  client_id: string
  name: string
  email: string
  total_sessions: number
  last_session_date: string | null // ISO date
}

export type LinkRequestStatus = "pending" | "accepted" | "declined"

/**
 * A connection request between a trainer and a client, as returned by the
 * /link-requests endpoints. `requested_by` says which side initiated;
 * compare it against your own role to know if a request is incoming
 * (theirs to you — you may accept/decline) or outgoing (awaiting them).
 */
export interface LinkRequest {
  request_id: string
  trainer_id: string
  trainer_name: string
  trainer_email: string
  client_id: string
  client_name: string
  client_email: string
  requested_by: Role
  status: LinkRequestStatus
  created_at: string // ISO datetime
  responded_at: string | null
}

/** The client's linked trainer from GET /api/clients/me/trainer. */
export interface LinkedTrainer {
  trainer_id: string
  name: string
  email: string
}

/** One exercise inside a synced session (dataSyncupService.SyncedExercise). */
export interface SyncedExercise {
  exercise_id: string
  exercise_template_id: string
  name: string
  sets: number
  reps: number
  weight_in_kg: number
}

/** One session in a synced client's history (dataSyncupService.SyncedSession). */
export interface SyncedSession {
  session_id: string
  session_date: string // ISO datetime
  exercises: SyncedExercise[]
}

/** Per-exercise progress stats (dataSyncupService.ExerciseProgress). */
export interface ExerciseProgress {
  exercise_template_id: string
  name: string
  times_performed: number
  max_weight_in_kg: number
  latest_weight_in_kg: number
  first_weight_in_kg: number
  weight_change_in_kg: number
  total_volume_in_kg: number
  first_performed: string
  last_performed: string
}

/**
 * Full sync payload for one client from
 * GET /api/trainers/me/clients/:clientId/sync.
 */
export interface ClientSyncData {
  client: { client_id: string; name: string; email: string }
  synced_at: string
  total_sessions: number
  sessions: SyncedSession[]
  progress: ExerciseProgress[]
}

/** A pending/settled reschedule proposal embedded on a schedule. */
export interface RescheduleRequest {
  proposed_start_time: string // ISO datetime
  proposed_duration_in_minutes: number
  message: string | null
  status: LinkRequestStatus
  requested_at: string
  responded_at: string | null
}

/**
 * One row of the trainer's merged calendar from
 * GET /api/trainers/me/schedules (scheduleService.TrainerScheduleEntry).
 */
export interface TrainerScheduleEntry {
  schedule_id: string
  client_id: string
  client_name: string
  client_email: string
  start_time: string // ISO datetime
  duration_in_minutes: number
  reschedule_request: RescheduleRequest | null
}
