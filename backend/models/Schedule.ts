import { Collection, ObjectId } from "mongodb";
import { getDb } from "../config/database";

export type RescheduleRequestStatus = "pending" | "accepted" | "declined";

// A trainer-initiated proposal to move a schedule. Lives on the schedule
// document; the client accepts (schedule times are updated) or declines.
export interface RescheduleRequest {
  proposed_start_time: Date;
  proposed_duration_in_minutes: number;
  message?: string;
  status: RescheduleRequestStatus;
  requested_at: Date;
  responded_at?: Date;
}

export interface Schedule {
  _id?: ObjectId;
  client_id: ObjectId;
  // Set when a trainer books the session. Legacy documents may not have it.
  trainer_id?: ObjectId;
  start_time: Date;
  duration_in_minutes: number;
  reschedule_request?: RescheduleRequest;
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
  return await collection().find({ client_id }).sort({ start_time: 1 }).toArray();
};

export const addSchedule = async (schedule: Schedule): Promise<ObjectId> => {
  return (await collection().insertOne(schedule)).insertedId;
};

export const getScheduleById = async (
  schedule_id: ObjectId,
): Promise<Schedule | null> => {
  return await collection().findOne({ _id: schedule_id });
};

export const deleteSchedule = async (schedule_id: ObjectId): Promise<void> => {
  await collection().deleteOne({ _id: schedule_id });
};

// Sets (or replaces) the reschedule request on a schedule.
export const setRescheduleRequest = async (
  schedule_id: ObjectId,
  request: RescheduleRequest,
): Promise<void> => {
  await collection().updateOne(
    { _id: schedule_id },
    { $set: { reschedule_request: request } },
  );
};

// Client accepted: move the schedule to the proposed slot and close the request.
export const applyRescheduleRequest = async (
  schedule_id: ObjectId,
  start_time: Date,
  duration_in_minutes: number,
  responded_at: Date,
): Promise<void> => {
  await collection().updateOne(
    { _id: schedule_id },
    {
      $set: {
        start_time,
        duration_in_minutes,
        "reschedule_request.status": "accepted" satisfies RescheduleRequestStatus,
        "reschedule_request.responded_at": responded_at,
      },
    },
  );
};

// Client declined: keep the original slot and close the request.
export const declineRescheduleRequest = async (
  schedule_id: ObjectId,
  responded_at: Date,
): Promise<void> => {
  await collection().updateOne(
    { _id: schedule_id },
    {
      $set: {
        "reschedule_request.status": "declined" satisfies RescheduleRequestStatus,
        "reschedule_request.responded_at": responded_at,
      },
    },
  );
};
