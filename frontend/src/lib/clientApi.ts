// API for the client dashboard (progress graphs, session history).
// Owned by: Rayan Maknojia (progress dashboard / client view).
//
// getMySessions fetches the logged-in client's workout sessions from the
// backend; the rest of these functions derive stats/graphs from that same
// list so there's only one network call per page load.

const API_BASE = "http://localhost:3000/api";

import type { WorkoutSession } from "@/types";
import { api } from "@/lib/api";
import type {
  ClientStats,
  ExerciseTemplate,
  PersonalBest,
  ProgressPoint,
  WeeklyVolume,
} from "@/types/client";

let sessionsCache: Promise<WorkoutSession[]> | null = null;

function loadSessions(): Promise<WorkoutSession[]> {
  if (!sessionsCache) {
    sessionsCache = api.getMyWorkoutSessions();
  }
  return sessionsCache;
}

function startOfWeek(iso: string): string {
  const d = new Date(iso);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday as start of week
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// --- API surface (backed by GET /api/me/workout-sessions) ---

export async function getMySessions(): Promise<WorkoutSession[]> {
  return loadSessions();
}

/** Distinct exercise names logged so far, for the progress-page picker. */
export async function getExerciseNames(): Promise<string[]> {
  const sessions = await loadSessions();
  const names = new Set<string>();
  for (const s of sessions) for (const e of s.exercises) names.add(e.name);
  return Array.from(names);
}

/** Weight-over-time series for a single exercise, sorted oldest → newest. */
export async function getWeightProgress(
  exerciseName: string,
): Promise<ProgressPoint[]> {
  const sessions = await loadSessions();
  const points: ProgressPoint[] = [];
  for (const s of sessions) {
    const match = s.exercises.find((e) => e.name === exerciseName);
    if (match && match.weight_in_kg !== null) {
      points.push({
        date: s.session_date,
        weight_in_kg: match.weight_in_kg,
        reps: match.reps,
        sets: match.sets,
      });
    }
  }
  points.sort((a, b) => a.date.localeCompare(b.date));
  return points;
}

/** Total training volume (sets × reps × weight) per week, oldest → newest. */
export async function getWeeklyVolume(): Promise<WeeklyVolume[]> {
  const sessions = await loadSessions();
  const byWeek = new Map<string, WeeklyVolume>();

  for (const s of sessions) {
    const key = startOfWeek(s.session_date);
    const entry = byWeek.get(key) ?? {
      week_start: key,
      volume: 0,
      session_count: 0,
    };
    entry.session_count += 1;
    for (const e of s.exercises) {
      entry.volume += e.sets * e.reps * (e.weight_in_kg ?? 0);
    }
    byWeek.set(key, entry);
  }

  return Array.from(byWeek.values()).sort((a, b) =>
    a.week_start.localeCompare(b.week_start),
  );
}

/** Powers the dashboard stat tiles. */
export async function getStats(): Promise<ClientStats> {
  const sessions = await loadSessions();
  const now = Date.now();

  const sessionsThisWeek = sessions.filter(
    (s) => now - new Date(s.session_date).getTime() < 7 * 86_400_000,
  ).length;

  // streak: consecutive weeks (back from this week) with >= 1 session
  const weekKeys = new Set(sessions.map((s) => startOfWeek(s.session_date)));
  let streak = 0;
  const cursor = new Date(startOfWeek(new Date().toISOString()));
  while (weekKeys.has(cursor.toISOString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }

  const bestByExercise = new Map<string, PersonalBest>();
  for (const s of sessions) {
    for (const e of s.exercises) {
      if (e.weight_in_kg === null) continue;
      const current = bestByExercise.get(e.name);
      if (!current || e.weight_in_kg > current.weight_in_kg) {
        bestByExercise.set(e.name, {
          exercise: e.name,
          weight_in_kg: e.weight_in_kg,
          reps: e.reps,
          achieved_on: s.session_date,
        });
      }
    }
  }

  return {
    total_sessions: sessions.length,
    sessions_this_week: sessionsThisWeek,
    current_streak_weeks: streak,
    personal_bests: Array.from(bestByExercise.values()).sort(
      (a, b) => b.weight_in_kg - a.weight_in_kg,
    ),
  };
}

export async function getExerciseTemplates(
  clientId: string,
): Promise<ExerciseTemplate[]> {
  const res = await fetch(`${API_BASE}/clients/${clientId}/exercise-templates`);

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data;
}

export async function addExerciseTemplate(
  clientId: string,
  name: string,
): Promise<ExerciseTemplate> {
  const res = await fetch(
    `${API_BASE}/clients/${clientId}/exercise-templates`,
    {
      method: "POST",
      body: JSON.stringify({ name }),
      headers: { "Content-Type": "application/json" },
    },
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error);
  }

  return data;
}
