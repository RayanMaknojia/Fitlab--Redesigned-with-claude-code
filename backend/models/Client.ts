import { ClientSession, Collection, ObjectId } from "mongodb";
import { getDb } from "../config/database";

export interface Client {
  _id: ObjectId;
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
