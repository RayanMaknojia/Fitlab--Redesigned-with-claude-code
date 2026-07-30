// API for the client dashboard (progress graphs, session history).
// Owned by: Rayan Maknojia (progress dashboard / client view).
//
// getMySessions fetches the logged-in client's workout sessions from the
// backend; the rest of these functions derive stats/graphs from that same
// list so there's only one network call per page load.

import type { WorkoutSession } from "@/types";
import { request } from "@/lib/request";
import type {
  ClientStats,
  ExerciseTemplate,
  PersonalBest,
  ProgressPoint,
  SessionExercise,
  WeeklyVolume,
  WorkoutSession as WorkoutSessionRecord,
} from "@/types/client";

let sessionsCache: Promise<WorkoutSession[]> | null = null;

function loadSessions(): Promise<WorkoutSession[]> {
  if (!sessionsCache) {
    sessionsCache = request<WorkoutSession[]>("/me/workout-sessions");
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
  return request<ExerciseTemplate[]>(
    `/clients/${clientId}/exercise-templates`,
  );
}

export async function addExerciseTemplate(
  clientId: string,
  name: string,
): Promise<ExerciseTemplate> {
  if (name.trim().length === 0) {
    throw new Error("Cannot have empty name");
  }

  return request<ExerciseTemplate>(
    `/clients/${clientId}/exercise-templates`,
    {
      method: "POST",
      body: JSON.stringify({ name }),
    },
  );
}

export async function updateExerciseTemplate(
  templateId: string,
  name: string,
): Promise<ExerciseTemplate> {
  if (name.trim().length === 0) {
    throw new Error("Cannot update with empty name");
  }

  return request<ExerciseTemplate>(`/exercise-templates/${templateId}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export async function deleteExerciseTemplate(
  templateId: string,
): Promise<void> {
  await request<void>(`/exercise-templates/${templateId}`, {
    method: "DELETE",
  });
}

export async function getClientSessions(
  clientId: string,
): Promise<WorkoutSessionRecord[]> {
  return request<WorkoutSessionRecord[]>(
    `/clients/${clientId}/workout-sessions`,
  );
}

export async function addClientSession(
  clientId: string,
  session_date: string,
): Promise<WorkoutSessionRecord> {
  if (!session_date) {
    throw new Error("Must enter in date");
  }

  return request<WorkoutSessionRecord>(
    `/clients/${clientId}/workout-sessions`,
    {
      method: "POST",
      body: JSON.stringify({ session_date }),
    },
  );
}

export async function getSessionById(
  sessionId: string,
): Promise<WorkoutSessionRecord> {
  return request<WorkoutSessionRecord>(`/workout-sessions/${sessionId}`);
}

export async function updateSessionById(
  sessionId: string,
  session_date: string,
): Promise<WorkoutSessionRecord> {
  if (!session_date) {
    throw new Error("Must enter in date");
  }

  return request<WorkoutSessionRecord>(`/workout-sessions/${sessionId}`, {
    method: "PUT",
    body: JSON.stringify({ session_date }),
  });
}

export async function deleteSessionById(sessionId: string) {
  await request<void>(`/workout-sessions/${sessionId}`, {
    method: "DELETE",
  });
}

export async function getSessionExercisesById(
  sessionId: string,
): Promise<SessionExercise[]> {
  return request<SessionExercise[]>(`/workout-sessions/${sessionId}/exercises`);
}

export async function addExerciseToSession(
  sessionId: string,
  exercise: Omit<SessionExercise, "session_id" | "template_name">,
): Promise<SessionExercise> {
  if (exercise.sets < 0 || exercise.reps < 0 || exercise.weight_in_kg < 0) {
    throw new Error(
      "Invalid exercise data. Sets and reps must be greater than 0, and weight in kg must be either omitted, or nonnegative",
    );
  }

  return request<SessionExercise>(
    `/workout-sessions/${sessionId}/exercises`,
    {
      method: "POST",
      body: JSON.stringify({ ...exercise }),
    },
  );
}

export async function updateExerciseById(
  sessionId: string,
  exerciseId: string,
  exercise: Omit<
    SessionExercise,
    "session_id" | "template_name" | "exercise_template_id"
  >,
): Promise<SessionExercise> {
  return request<SessionExercise>(
    `/workout-sessions/${sessionId}/exercises/${exerciseId}`,
    {
      method: "PUT",
      body: JSON.stringify(exercise),
    },
  );
}

export async function deleteExerciseById(
  sessionId: string,
  exerciseId: string,
) {
  await request<void>(
    `/workout-sessions/${sessionId}/exercises/${exerciseId}`,
    {
      method: "DELETE",
    },
  );
}
