// Mock API for the client dashboard (progress graphs, session history).
// Owned by: Rayan Maknojia (progress dashboard / client view).
//
// Mirrors the pattern in lib/trainerApi.ts: every function matches the shape
// of a future REST endpoint (commented above each one). When the Express
// backend exposes real WorkoutSession / SessionExercise / ExerciseTemplate
// routes, swap the bodies for fetch() calls — components won't need to change.
//
// State persists in localStorage so the demo survives refreshes.

import type { Exercise, WorkoutSession } from "@/types"
import type {
  ClientStats,
  PersonalBest,
  ProgressPoint,
  WeeklyVolume,
} from "@/types/client"

const STORE_KEY = "fitlab.client.mock.v1"
const CLIENT_ID = "c-me" // TODO(auth - Alex): from auth context
const LATENCY = 350 // simulated network delay (ms)

interface Store {
  sessions: WorkoutSession[]
}

// --- seed data: ~10 weeks of progressive-overload training history ---

const EXERCISE_PLAN: { name: string; startWeight: number; weeklyGain: number; sets: number; reps: number }[] = [
  { name: "Back Squat", startWeight: 60, weeklyGain: 2.5, sets: 4, reps: 6 },
  { name: "Bench Press", startWeight: 45, weeklyGain: 1.25, sets: 3, reps: 8 },
  { name: "Deadlift", startWeight: 80, weeklyGain: 2.5, sets: 3, reps: 5 },
  { name: "Pull Ups", startWeight: 0, weeklyGain: 0, sets: 3, reps: 10 },
]

function seed(): Store {
  const sessions: WorkoutSession[] = []
  const weeks = 10
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let w = weeks; w >= 0; w--) {
    // two sessions per week: Monday and Thursday
    for (const offset of [1, 4]) {
      const date = new Date(today)
      date.setDate(date.getDate() - w * 7 + offset - today.getDay())
      if (date > today) continue

      const exercises: Exercise[] = EXERCISE_PLAN
        // alternate which lifts show up so sessions look realistic
        .filter((_, i) => (offset === 1 ? i % 2 === 0 : i % 2 === 1) || i === 3)
        .map((plan) => {
          const progressed = plan.startWeight + plan.weeklyGain * (weeks - w)
          const wobble = ((date.getDate() * 7) % 5) - 2 // small +/- variance
          return {
            name: plan.name,
            sets: plan.sets,
            reps: plan.reps,
            weight_in_kg:
              plan.name === "Pull Ups" ? null : Math.max(0, Math.round(progressed + wobble)),
          }
        })

      sessions.push({
        session_id: `${CLIENT_ID}-s${sessions.length}`,
        client_id: CLIENT_ID,
        exercises,
        session_date: date.toISOString(),
      })
    }
  }

  return { sessions: sessions.reverse() } // most recent first
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

function startOfWeek(iso: string): string {
  const d = new Date(iso)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day // Monday as start of week
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

// --- API surface (future REST endpoints noted above each) ---

/** GET /api/clients/me/sessions */
export async function getMySessions(): Promise<WorkoutSession[]> {
  return delay(load().sessions)
}

/**
 * GET /api/clients/me/exercise-templates
 * Distinct exercise names logged so far, for the progress-page picker.
 */
export async function getExerciseNames(): Promise<string[]> {
  const sessions = load().sessions
  const names = new Set<string>()
  for (const s of sessions) for (const e of s.exercises) names.add(e.name)
  return delay(Array.from(names))
}

/**
 * GET /api/clients/me/progress?exercise=Back+Squat
 * Weight-over-time series for a single exercise, sorted oldest → newest.
 */
export async function getWeightProgress(exerciseName: string): Promise<ProgressPoint[]> {
  const sessions = load().sessions
  const points: ProgressPoint[] = []
  for (const s of sessions) {
    const match = s.exercises.find((e) => e.name === exerciseName)
    if (match && match.weight_in_kg !== null) {
      points.push({
        date: s.session_date,
        weight_in_kg: match.weight_in_kg,
        reps: match.reps,
        sets: match.sets,
      })
    }
  }
  points.sort((a, b) => a.date.localeCompare(b.date))
  return delay(points)
}

/**
 * GET /api/clients/me/volume?weeks=10
 * Total training volume (sets × reps × weight) per week, oldest → newest.
 */
export async function getWeeklyVolume(): Promise<WeeklyVolume[]> {
  const sessions = load().sessions
  const byWeek = new Map<string, WeeklyVolume>()

  for (const s of sessions) {
    const key = startOfWeek(s.session_date)
    const entry = byWeek.get(key) ?? { week_start: key, volume: 0, session_count: 0 }
    entry.session_count += 1
    for (const e of s.exercises) {
      entry.volume += e.sets * e.reps * (e.weight_in_kg ?? 0)
    }
    byWeek.set(key, entry)
  }

  const weeks = Array.from(byWeek.values()).sort((a, b) =>
    a.week_start.localeCompare(b.week_start)
  )
  return delay(weeks)
}

/** GET /api/clients/me/stats — powers the dashboard stat tiles. */
export async function getStats(): Promise<ClientStats> {
  const sessions = load().sessions
  const now = Date.now()

  const sessionsThisWeek = sessions.filter(
    (s) => now - new Date(s.session_date).getTime() < 7 * 86_400_000
  ).length

  // streak: consecutive weeks (back from this week) with >= 1 session
  const weekKeys = new Set(sessions.map((s) => startOfWeek(s.session_date)))
  let streak = 0
  const cursor = new Date(startOfWeek(new Date().toISOString()))
  while (weekKeys.has(cursor.toISOString())) {
    streak += 1
    cursor.setDate(cursor.getDate() - 7)
  }

  const bestByExercise = new Map<string, PersonalBest>()
  for (const s of sessions) {
    for (const e of s.exercises) {
      if (e.weight_in_kg === null) continue
      const current = bestByExercise.get(e.name)
      if (!current || e.weight_in_kg > current.weight_in_kg) {
        bestByExercise.set(e.name, {
          exercise: e.name,
          weight_in_kg: e.weight_in_kg,
          reps: e.reps,
          achieved_on: s.session_date,
        })
      }
    }
  }

  return delay({
    total_sessions: sessions.length,
    sessions_this_week: sessionsThisWeek,
    current_streak_weeks: streak,
    personal_bests: Array.from(bestByExercise.values()).sort(
      (a, b) => b.weight_in_kg - a.weight_in_kg
    ),
  })
}

/** Demo helper: reset mock data back to the seeded default. */
export function resetMockData(): void {
  localStorage.removeItem(STORE_KEY)
}
