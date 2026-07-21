import { Collection, ObjectId } from "mongodb";
import { getDb, getClient } from "../config/database";
import * as sessionExerciseModel from "./SessionExercise";

export interface ExerciseTemplate {
  _id?: ObjectId;
  client_id: ObjectId;
  name: string;
}

export const collection = (): Collection<ExerciseTemplate> =>
  getDb().collection("exercise_templates");

export const init = async (): Promise<void> => {
  await collection().createIndex({ name: 1 });
};

export const getExerciseTemplates = async (
  client_id: ObjectId,
): Promise<ExerciseTemplate[]> => {
  return await collection().find({ client_id }).toArray();
};

export const getExerciseTemplate = async (
  templateId: ObjectId,
): Promise<ExerciseTemplate | null> => {
  return await collection().findOne({ _id: templateId });
};

export const addExerciseTemplate = async (
  template: ExerciseTemplate,
): Promise<ObjectId> => {
  return (
    await collection().insertOne({
      name: template.name,
      client_id: template.client_id,
    })
  ).insertedId;
};

export const updateTemplateById = async (
  templateId: ObjectId,
  name: string,
): Promise<void> => {
  await collection().updateOne({ _id: templateId }, { $set: { name } });
};

export const templateExists = async (
  templateId: ObjectId,
): Promise<boolean> => {
  return (
    (await collection().countDocuments({ _id: templateId }, { limit: 1 })) === 1
  );
};

export const deleteTemplateAndAssociatedExercises = async (
  templateId: ObjectId,
) => {
  const session = getClient().startSession();

  try {
    await session.withTransaction(async () => {
      await sessionExerciseModel.deleteByTemplateId(templateId, session);
      await collection().deleteOne({ _id: templateId }, { session });
    });
  } finally {
    await session.endSession();
  }
};
