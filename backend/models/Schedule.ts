import { Collection, ObjectId } from "mongodb";
import { getDb } from "../config/database";

export interface Schedule {
  _id?: ObjectId;
  client_id: ObjectId;
  start_time: Date;
  duration_in_minutes: number;
}

export const collection = (): Collection<Schedule> =>
  getDb().collection("schedules");

export const init = async (): Promise<void> => {
  await collection().createIndex({ client_id: 1 });
  await collection().createIndex({ trainer_id: 1 });
};

export const getSchedules = async (
  client_id: ObjectId,
): Promise<Schedule[]> => {
  return await collection().find({ client_id }).toArray();
};

export const addSchedule = async (schedule: Schedule): Promise<void> => {
  await collection().insertOne(schedule);
};

export const getScheduleById = async (
  schedule_id: ObjectId,
): Promise<Schedule | null> => {
  return await collection().findOne({ _id: schedule_id });
};

export const deleteSchedule = async (schedule_id: ObjectId): Promise<void> => {
  await collection().deleteOne({ _id: schedule_id });
};
