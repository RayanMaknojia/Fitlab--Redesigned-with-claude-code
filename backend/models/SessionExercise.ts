import { ClientSession, Collection, ObjectId } from "mongodb";
import { getDb } from "../config/database";

export interface SessionExercise {
  _id?: ObjectId;
  session_id: ObjectId;
  exercise_template_id: ObjectId;
  sets: number;
  reps: number;
  weight_in_kg: number;
}

export const collection = (): Collection<SessionExercise> =>
  getDb().collection("session_exercises");

export const init = async (): Promise<void> => {
  await collection().createIndex({ session_id: 1 });
};

export const getSessionExercises = async (session_id: ObjectId) => {
  return await collection()
    .aggregate([
      { $match: { session_id } },
      {
        $lookup: {
          from: "exercise_templates",
          localField: "exercise_template_id",
          foreignField: "_id",
          as: "template",
        },
      },
      { $unwind: "$template" },
      {
        $project: {
          _id: 1,
          exercise_template_id: 1,
          sets: 1,
          reps: 1,
          weight_in_kg: 1,
          template_name: "$template.name",
        },
      },
    ])
    .toArray();
};

export const addSessionExercise = async (exercise: SessionExercise): Promise<void> => {
  await collection().insertOne(exercise);
};

export const getSessionExerciseById = async (
  exerciseId: ObjectId,
): Promise<SessionExercise | null> => {
  return await collection().findOne({ _id: exerciseId });
};

export const updateExerciseById = async (
  exerciseId: ObjectId,
  newExercise: Omit<SessionExercise, "_id" | "session_id" | "exercise_template_id">,
) => {
  await collection().updateOne(
    { _id: exerciseId },
    {
      $set: {
        sets: newExercise.sets,
        reps: newExercise.reps,
        weight_in_kg: newExercise.weight_in_kg,
      },
    },
  );
};

export const deleteExerciseById = async (exerciseId: ObjectId) => {
  await collection().deleteOne({ _id: exerciseId });
};

export const deleteBySessionId = async (
  sessionId: ObjectId,
  session?: ClientSession,
): Promise<void> => {
  await collection().deleteMany({ session_id: sessionId }, session ? { session } : {});
};

export const deleteByTemplateId = async (
  templateId: ObjectId,
  session?: ClientSession,
): Promise<void> => {
  await collection().deleteMany(
    { exercise_template_id: templateId },
    session ? { session } : {},
  );
};
