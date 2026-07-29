import { ClientSession, Collection, ObjectId } from "mongodb";
import { getDb } from "../config/database";

export interface Client {
  _id: ObjectId;
  // @Jason: nothing sets this yet outside the linking flow you're building.
  // Trainer access to a client's data (workout sessions, schedules, exercise
  // templates) is gated on this field, so trainer access won't actually work
  // end-to-end until the link request/accept flow writes it.
  trainer_id?: ObjectId;
}

export const collection = (): Collection<Client> => getDb().collection("clients");

export const init = async (): Promise<void> => {
  await collection().createIndex({ trainer_id: 1 });
};

export const addClient = async (
  client: Client,
  session?: ClientSession,
): Promise<void> => {
  await collection().insertOne(client, session ? { session } : {});
};

export const getClientById = async (
  clientId: ObjectId,
): Promise<Client | null> => {
  return await collection().findOne({ _id: clientId });
};

export const getClientsByTrainerId = async (
  trainerId: ObjectId,
): Promise<Client[]> => {
  return await collection().find({ trainer_id: trainerId }).toArray();
};

// True only when the client exists AND is linked to this trainer.
export const isLinkedToTrainer = async (
  clientId: ObjectId,
  trainerId: ObjectId,
): Promise<boolean> => {
  return (
    (await collection().countDocuments(
      { _id: clientId, trainer_id: trainerId },
      { limit: 1 },
    )) === 1
  );
};
