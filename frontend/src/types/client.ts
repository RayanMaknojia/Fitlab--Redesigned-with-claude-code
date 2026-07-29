// Client-side types — additive to the shared types in ./index.ts.
// Owned by: [your name] (progress dashboard / client view).
// Does not modify Jiachen's index.ts — imports and extends it instead.

import type { Exercise } from "@/types";

/** One point on a "weight over time" line chart for a single exercise. */
export interface ProgressPoint {
  date: string; // ISO date
  weight_in_kg: number;
  reps: number;
  sets: number;
}

/** Total training volume (sets × reps × weight) for a single week. */
export interface WeeklyVolume {
  week_start: string; // ISO date, Monday of that week
  volume: number;
  session_count: number;
}

/** Best-ever set for a given exercise, for the "personal bests" strip. */
export interface PersonalBest {
  exercise: string;
  weight_in_kg: number;
  reps: number;
  achieved_on: string; // ISO date
}

/** Aggregated stats for the client dashboard's stat tiles. */
export interface ClientStats {
  total_sessions: number;
  sessions_this_week: number;
  current_streak_weeks: number;
  personal_bests: PersonalBest[];
}

export interface ExerciseTemplate {
  _id: string;
  client_id: string;
  name: string;
}

export interface WorkoutSession {
  _id?: string;
  client_id: string;
  session_date: string;
}

export type { Exercise };
