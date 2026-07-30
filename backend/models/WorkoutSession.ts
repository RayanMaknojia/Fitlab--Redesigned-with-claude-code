import { Collection, ObjectId, WithId } from "mongodb";
import { getDb, getClient } from "../config/database";
import * as sessionExerciseModel from "./SessionExercise";

export interface WorkoutSession {
  _id?: ObjectId;
  client_id: ObjectId;
  session_date: Date;
}

export const collection = (): Collection<WorkoutSession> =>
  getDb().collection("sessions");

export const init = async (): Promise<void> => {
  await collection().createIndex({ client_id: 1 });
};

export const getClientSessions = async (
  client_id: ObjectId,
): Promise<WorkoutSession[]> => {
  return await collection()
    .find({ client_id })
    .sort({ session_date: -1 })
    .toArray();
};

export const getWorkoutSession = async (
  sessionId: ObjectId,
): Promise<WithId<WorkoutSession> | null> => {
  return await collection().findOne({ _id: sessionId });
};

export const addWorkoutSession = async (
  session: Omit<WorkoutSession, "_id">,
): Promise<ObjectId> => {
  return (
    await collection().insertOne({
      client_id: session.client_id,
      session_date: session.session_date,
    })
  ).insertedId;
};

export const updateSessionById = async (
  sessionId: ObjectId,
  date: Date,
): Promise<void> => {
  await collection().updateOne(
    { _id: sessionId },
    { $set: { session_date: date } },
  );
};

export const deleteSessionById = async (sessionId: ObjectId): Promise<void> => {
  const session = getClient().startSession();

  try {
    await session.withTransaction(async () => {
      await sessionExerciseModel.deleteBySessionId(sessionId, session);
      await collection().deleteOne({ _id: sessionId }, { session });
    });
  } finally {
    await session.endSession();
  }
};
