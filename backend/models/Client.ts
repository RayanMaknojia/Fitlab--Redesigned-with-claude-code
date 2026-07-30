import { ClientSession, Collection, ObjectId } from "mongodb";
import { getDb } from "../config/database";

export interface Client {
  _id: ObjectId;
  // Written by the linking flow (linkService) when a link request is
  // accepted. Trainer access to a client's data (workout sessions,
  // schedules, exercise templates) is gated on this field. A client has
  // at most one trainer at a time — by design, not by accident.
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

/**
 * Atomically links the client to the trainer, but only if the client has
 * no trainer yet (a client can have at most one trainer). Returns false
 * when the client is missing or already has a trainer — the $exists guard
 * makes concurrent accepts race-safe.
 */
export const setTrainerIfUnset = async (
  clientId: ObjectId,
  trainerId: ObjectId,
  session?: ClientSession,
): Promise<boolean> => {
  const result = await collection().updateOne(
    { _id: clientId, trainer_id: { $exists: false } },
    { $set: { trainer_id: trainerId } },
    session ? { session } : {},
  );
  return result.modifiedCount === 1;
};

/**
 * Removes the client's trainer link. When `trainerId` is given the unlink
 * only succeeds if that exact trainer is the linked one (trainer-initiated
 * unlink); without it, any existing link is removed (client-initiated).
 * Returns false when there was no matching link to remove.
 */
export const unsetTrainer = async (
  clientId: ObjectId,
  trainerId?: ObjectId,
): Promise<boolean> => {
  const filter = trainerId
    ? { _id: clientId, trainer_id: trainerId }
    : { _id: clientId, trainer_id: { $exists: true } };
  const result = await collection().updateOne(filter, {
    $unset: { trainer_id: "" },
  });
  return result.modifiedCount === 1;
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
