import { Collection, ObjectId } from "mongodb";
import { getDb } from "../config/database";

export interface Schedule {
  _id?: ObjectId;
  client_id: ObjectId;
  trainer_id: ObjectId;
  start_time: Date;
  duration: number;
}

export const collection = (): Collection<Schedule> => getDb().collection("schedules");

export const init = async (): Promise<void> => {
  await collection().createIndex({ client_id: 1 });
  await collection().createIndex({ trainer_id: 1 });
};
