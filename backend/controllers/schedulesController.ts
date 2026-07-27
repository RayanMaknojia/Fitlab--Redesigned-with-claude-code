import { Request, Response } from "express";
import * as z from "zod";
import * as userModel from "../models/User";
import * as scheduleModel from "../models/Schedule";
import { parseObjectId } from "../utils/parseObjectId";

export const getClientSchedules = async (req: Request, res: Response) => {
  const client_id = parseObjectId(req.params.clientId);

  if (!client_id) {
    return res.status(400).json({ error: "Invalid client id." });
  }

  const userExists = await userModel.userExists(client_id);

  if (!userExists) {
    return res.status(404).json({ error: "Cannot find client." });
  }

  const schedules = await scheduleModel.getSchedules(client_id);

  res.status(200).json(schedules);
};

const ScheduleInput = z.object({
  start_time: z.coerce.date(),
  duration_in_minutes: z.int().positive(),
});

export const addClientSchedule = async (req: Request, res: Response) => {
  const client_id = parseObjectId(req.params.clientId);

  if (!client_id) {
    return res.status(400).json({ error: "Invalid client id." });
  }

  const userExists = await userModel.userExists(client_id);

  if (!userExists) {
    return res.status(404).json({ error: "Cannot find client." });
  }

  const result = ScheduleInput.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: "Invalid schedule data." });
  }

  const schedule = {
    client_id,
    start_time: result.data.start_time,
    duration_in_minutes: result.data.duration_in_minutes,
  };

  const resultId = await scheduleModel.addSchedule(schedule);

  res.status(201).json({ _id: resultId, ...schedule });
};

export const deleteClientSchedule = async (req: Request, res: Response) => {
  const schedule_id = parseObjectId(req.params.scheduleId);

  if (!schedule_id) {
    return res.status(400).json({ error: "Invalid schedule id." });
  }

  const scheduleExists = await scheduleModel.getScheduleById(schedule_id);

  if (!scheduleExists) {
    return res.status(404).json({ error: "Cannot find schedule." });
  }

  await scheduleModel.deleteSchedule(schedule_id);

  res.status(204).send();
};
