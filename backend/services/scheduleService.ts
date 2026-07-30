import { ObjectId } from "mongodb";
import * as clientModel from "../models/Client";
import * as scheduleModel from "../models/Schedule";
import type { RescheduleRequest, Schedule } from "../models/Schedule";

/**
 * ScheduleService
 *
 * Trainer-side scheduling for linked clients:
 * - a trainer can create schedules only for clients whose `trainer_id`
 *   points at them (the link itself is written by the linking flow,
 *   which is built separately),
 * - a trainer sees one merged view of every linked client's schedules,
 * - a client sees their own schedules,
 * - a trainer can send a reschedule request that the client accepts
 *   (schedule moves to the proposed slot) or declines.
 */

export class ClientNotLinkedError extends Error {
  constructor() {
    super("Client is not linked to this trainer.");
  }
}

export class ScheduleNotFoundError extends Error {
  constructor() {
    super("Cannot find schedule.");
  }
}

export class ScheduleAccessError extends Error {
  constructor() {
    super("Not allowed to modify this schedule.");
  }
}

export class NoPendingRescheduleError extends Error {
  constructor() {
    super("Schedule has no pending reschedule request.");
  }
}

export interface RescheduleRequestView {
  proposed_start_time: string;
  proposed_duration_in_minutes: number;
  message: string | null;
  status: "pending" | "accepted" | "declined";
  requested_at: string;
  responded_at: string | null;
}

// One row in the trainer's merged schedule view.
export interface TrainerScheduleEntry {
  schedule_id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  start_time: string;
  duration_in_minutes: number;
  reschedule_request: RescheduleRequestView | null;
}

// One row in the client's schedule view.
export interface ClientScheduleEntry {
  schedule_id: string;
  trainer_id: string | null;
  trainer_name: string | null;
  start_time: string;
  duration_in_minutes: number;
  reschedule_request: RescheduleRequestView | null;
}

export interface ScheduleInput {
  start_time: Date;
  duration_in_minutes: number;
}

export interface RescheduleInput {
  proposed_start_time: Date;
  proposed_duration_in_minutes: number;
  message?: string | undefined;
}

const toRescheduleView = (
  request: RescheduleRequest | undefined | null,
): RescheduleRequestView | null => {
  if (!request) {
    return null;
  }

  return {
    proposed_start_time: new Date(request.proposed_start_time).toISOString(),
    proposed_duration_in_minutes: request.proposed_duration_in_minutes,
    message: request.message ?? null,
    status: request.status,
    requested_at: new Date(request.requested_at).toISOString(),
    responded_at: request.responded_at
      ? new Date(request.responded_at).toISOString()
      : null,
  };
};

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
 * Every schedule of every client linked to this trainer, with client
 * name/email joined in, sorted by start time. [] when the trainer has
 * no linked clients (the default state).
 */
export const getTrainerSchedules = async (
  trainerId: ObjectId,
): Promise<TrainerScheduleEntry[]> => {
  const rows = await clientModel
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
          from: "schedules",
          localField: "_id",
          foreignField: "client_id",
          as: "schedule",
        },
      },
      { $unwind: "$schedule" },
      {
        $project: {
          _id: "$schedule._id",
          client_id: "$_id",
          client_name: "$user.name",
          client_email: "$user.email",
          start_time: "$schedule.start_time",
          duration_in_minutes: "$schedule.duration_in_minutes",
          reschedule_request: "$schedule.reschedule_request",
        },
      },
      { $sort: { start_time: 1 } },
    ])
    .toArray();

  return rows.map((row) => ({
    schedule_id: row._id.toString(),
    client_id: row.client_id.toString(),
    client_name: row.client_name,
    client_email: row.client_email,
    start_time: new Date(row.start_time).toISOString(),
    duration_in_minutes: row.duration_in_minutes,
    reschedule_request: toRescheduleView(row.reschedule_request),
  }));
};

/** A single client's schedules with the trainer's name joined in, sorted by start time. */
export const getClientSchedules = async (
  clientId: ObjectId,
): Promise<ClientScheduleEntry[]> => {
  const rows = await scheduleModel
    .collection()
    .aggregate([
      { $match: { client_id: clientId } },
      {
        $lookup: {
          from: "users",
          localField: "trainer_id",
          foreignField: "_id",
          as: "trainer",
        },
      },
      { $unwind: { path: "$trainer", preserveNullAndEmptyArrays: true } },
      { $sort: { start_time: 1 } },
    ])
    .toArray();

  return rows.map((row) => ({
    schedule_id: row._id.toString(),
    trainer_id: row.trainer_id ? row.trainer_id.toString() : null,
    trainer_name: row.trainer ? row.trainer.name : null,
    start_time: new Date(row.start_time).toISOString(),
    duration_in_minutes: row.duration_in_minutes,
    reschedule_request: toRescheduleView(row.reschedule_request),
  }));
};

/**
 * Trainer books a session for a linked client.
 * Throws ClientNotLinkedError if the client isn't linked to this trainer.
 */
export const createSchedule = async (
  trainerId: ObjectId,
  clientId: ObjectId,
  input: ScheduleInput,
): Promise<Schedule> => {
  await assertLinked(trainerId, clientId);

  const schedule: Schedule = {
    client_id: clientId,
    trainer_id: trainerId,
    start_time: input.start_time,
    duration_in_minutes: input.duration_in_minutes,
  };

  const id = await scheduleModel.addSchedule(schedule);
  return { ...schedule, _id: id };
};

// Loads a schedule and verifies the trainer is linked to its client.
const getScheduleForTrainer = async (
  trainerId: ObjectId,
  scheduleId: ObjectId,
): Promise<Schedule> => {
  const schedule = await scheduleModel.getScheduleById(scheduleId);

  if (!schedule) {
    throw new ScheduleNotFoundError();
  }

  const linked = await clientModel.isLinkedToTrainer(
    schedule.client_id,
    trainerId,
  );

  if (!linked) {
    throw new ScheduleAccessError();
  }

  return schedule;
};

/**
 * Trainer proposes a new slot for an existing schedule. Replaces any
 * previous request on the schedule (so a trainer can re-send after a
 * decline or update a still-pending proposal). The client sees it as
 * pending until they respond.
 */
export const requestReschedule = async (
  trainerId: ObjectId,
  scheduleId: ObjectId,
  input: RescheduleInput,
): Promise<RescheduleRequestView> => {
  await getScheduleForTrainer(trainerId, scheduleId);

  const request: RescheduleRequest = {
    proposed_start_time: input.proposed_start_time,
    proposed_duration_in_minutes: input.proposed_duration_in_minutes,
    ...(input.message !== undefined && { message: input.message }),
    status: "pending",
    requested_at: new Date(),
  };

  await scheduleModel.setRescheduleRequest(scheduleId, request);
  return toRescheduleView(request)!;
};

/**
 * Client answers a pending reschedule request on their own schedule.
 * Accept moves the schedule to the proposed slot; decline keeps the
 * original one. Either way the request is closed.
 */
export const respondToReschedule = async (
  clientId: ObjectId,
  scheduleId: ObjectId,
  accept: boolean,
): Promise<ClientScheduleEntry> => {
  const schedule = await scheduleModel.getScheduleById(scheduleId);

  if (!schedule) {
    throw new ScheduleNotFoundError();
  }

  if (!schedule.client_id.equals(clientId)) {
    throw new ScheduleAccessError();
  }

  const request = schedule.reschedule_request;

  if (!request || request.status !== "pending") {
    throw new NoPendingRescheduleError();
  }

  const respondedAt = new Date();

  if (accept) {
    await scheduleModel.applyRescheduleRequest(
      scheduleId,
      request.proposed_start_time,
      request.proposed_duration_in_minutes,
      respondedAt,
    );
  } else {
    await scheduleModel.declineRescheduleRequest(scheduleId, respondedAt);
  }

  const updated = await scheduleModel.getScheduleById(scheduleId);
  const trainer = updated!.trainer_id ?? null;

  return {
    schedule_id: updated!._id!.toString(),
    trainer_id: trainer ? trainer.toString() : null,
    trainer_name: null, // callers needing the name use getClientSchedules
    start_time: new Date(updated!.start_time).toISOString(),
    duration_in_minutes: updated!.duration_in_minutes,
    reschedule_request: toRescheduleView(updated!.reschedule_request),
  };
};

/**
 * Client books a session for themself (no trainer attached).
 * Access is checked by requireClientAccess before this runs.
 */
export const createSelfSchedule = async (
  clientId: ObjectId,
  input: ScheduleInput,
): Promise<Schedule> => {
  const schedule: Schedule = {
    client_id: clientId,
    start_time: input.start_time,
    duration_in_minutes: input.duration_in_minutes,
  };

  const id = await scheduleModel.addSchedule(schedule);
  return { ...schedule, _id: id };
};

/** Deletes a schedule. Access is checked by requireScheduleAccess before this runs. */
export const deleteSchedule = async (scheduleId: ObjectId): Promise<void> => {
  await scheduleModel.deleteSchedule(scheduleId);
};
