import { ObjectId } from "mongodb";
import * as userModel from "../models/User";
import * as clientModel from "../models/Client";
import * as workoutSessionModel from "../models/WorkoutSession";
import * as sessionExerciseModel from "../models/SessionExercise";

/**
 * DataSyncupService
 *
 * Responsible for syncing a linked client's data to their trainer:
 * profile info, workout session history (with exercises), and computed
 * progress stats. All reads are scoped to the trainer — a trainer can
 * only pull data for clients whose `trainer_id` points at them.
 */

export interface ClientSummary {
  client_id: string;
  name: string;
  email: string;
  total_sessions: number;
  last_session_date: string | null;
}

export interface SyncedExercise {
  exercise_id: string;
  exercise_template_id: string;
  name: string;
  sets: number;
  reps: number;
  weight_in_kg: number;
}

export interface SyncedSession {
  session_id: string;
  session_date: string;
  exercises: SyncedExercise[];
}

export interface ExerciseProgress {
  exercise_template_id: string;
  name: string;
  times_performed: number;
  max_weight_in_kg: number;
  latest_weight_in_kg: number;
  first_weight_in_kg: number;
  weight_change_in_kg: number;
  total_volume_in_kg: number; // sum of sets * reps * weight across history
  first_performed: string;
  last_performed: string;
}

export interface ClientSyncData {
  client: { client_id: string; name: string; email: string };
  synced_at: string;
  total_sessions: number;
  sessions: SyncedSession[];
  progress: ExerciseProgress[];
}

export class ClientNotLinkedError extends Error {
  constructor() {
    super("Client is not linked to this trainer.");
  }
}

/** Throws ClientNotLinkedError unless the client exists and belongs to the trainer. */
export const assertLinked = async (
  trainerId: ObjectId,
  clientId: ObjectId,
): Promise<void> => {
  const linked = await clientModel.isLinkedToTrainer(clientId, trainerId);
  if (!linked) {
    throw new ClientNotLinkedError();
  }
};

/**
 * All clients linked to a trainer, with profile info and a session summary.
 * Returns [] for a trainer with no linked clients (the default state).
 */
export const getLinkedClients = async (
  trainerId: ObjectId,
): Promise<ClientSummary[]> => {
  const summaries = await clientModel
    .collection()
    .aggregate([
      { $match: { trainer_id: trainerId } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "sessions",
          localField: "_id",
          foreignField: "client_id",
          as: "sessions",
        },
      },
      {
        $project: {
          _id: 1,
          name: "$user.name",
          email: "$user.email",
          total_sessions: { $size: "$sessions" },
          last_session_date: { $max: "$sessions.session_date" },
        },
      },
      { $sort: { name: 1 } },
    ])
    .toArray();

  return summaries.map((s) => ({
    client_id: s._id.toString(),
    name: s.name,
    email: s.email,
    total_sessions: s.total_sessions,
    last_session_date: s.last_session_date
      ? new Date(s.last_session_date).toISOString()
      : null,
  }));
};

/** A client's full workout session history, newest first, with exercises. */
export const getClientSessionHistory = async (
  clientId: ObjectId,
): Promise<SyncedSession[]> => {
  const sessions = await workoutSessionModel.getClientSessions(clientId);

  return await Promise.all(
    sessions.map(async (session) => {
      const exercises =
        await sessionExerciseModel.getSessionExercisesAndTemplateNames(
          session._id!,
        );

      return {
        session_id: session._id!.toString(),
        session_date: session.session_date.toISOString(),
        exercises: exercises.map((e) => ({
          exercise_id: e._id.toString(),
          exercise_template_id: e.exercise_template_id.toString(),
          name: e.template_name,
          sets: e.sets,
          reps: e.reps,
          weight_in_kg: e.weight_in_kg,
        })),
      };
    }),
  );
};

/**
 * Per-exercise progress computed across the client's whole history:
 * how often each exercise was performed, max/first/latest weight,
 * weight change, and total volume.
 */
export const getClientProgress = async (
  clientId: ObjectId,
): Promise<ExerciseProgress[]> => {
  const progress = await sessionExerciseModel
    .collection()
    .aggregate([
      {
        $lookup: {
          from: "sessions",
          localField: "session_id",
          foreignField: "_id",
          as: "session",
        },
      },
      { $unwind: "$session" },
      { $match: { "session.client_id": clientId } },
      { $sort: { "session.session_date": 1 } },
      {
        $group: {
          _id: "$exercise_template_id",
          times_performed: { $sum: 1 },
          max_weight_in_kg: { $max: "$weight_in_kg" },
          first_weight_in_kg: { $first: "$weight_in_kg" },
          latest_weight_in_kg: { $last: "$weight_in_kg" },
          total_volume_in_kg: {
            $sum: { $multiply: ["$sets", "$reps", "$weight_in_kg"] },
          },
          first_performed: { $first: "$session.session_date" },
          last_performed: { $last: "$session.session_date" },
        },
      },
      {
        $lookup: {
          from: "exercise_templates",
          localField: "_id",
          foreignField: "_id",
          as: "template",
        },
      },
      { $unwind: "$template" },
      { $sort: { "template.name": 1 } },
    ])
    .toArray();

  return progress.map((p) => ({
    exercise_template_id: p._id.toString(),
    name: p.template.name,
    times_performed: p.times_performed,
    max_weight_in_kg: p.max_weight_in_kg,
    latest_weight_in_kg: p.latest_weight_in_kg,
    first_weight_in_kg: p.first_weight_in_kg,
    weight_change_in_kg: p.latest_weight_in_kg - p.first_weight_in_kg,
    total_volume_in_kg: p.total_volume_in_kg,
    first_performed: new Date(p.first_performed).toISOString(),
    last_performed: new Date(p.last_performed).toISOString(),
  }));
};

/**
 * Full sync payload for one client: profile + session history + progress.
 * This is the single call a trainer's UI needs to hydrate a client page.
 */
export const getClientSyncData = async (
  clientId: ObjectId,
): Promise<ClientSyncData | null> => {
  const user = await userModel.findUserById(clientId);

  if (!user) {
    return null;
  }

  const [sessions, progress] = await Promise.all([
    getClientSessionHistory(clientId),
    getClientProgress(clientId),
  ]);

  return {
    client: {
      client_id: clientId.toString(),
      name: user.name,
      email: user.email,
    },
    synced_at: new Date().toISOString(),
    total_sessions: sessions.length,
    sessions,
    progress,
  };
};
