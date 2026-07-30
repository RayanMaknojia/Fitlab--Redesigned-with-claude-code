import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import * as z from "zod";
import * as scheduleService from "../services/scheduleService";
import { parseObjectId } from "../utils/parseObjectId";

/**
 * Controller for ScheduleService endpoints.
 *
 * Legacy :clientId/:scheduleId routes run behind requireClientAccess /
 * requireScheduleAccess, which handle invalid ids, missing resources and
 * access checks. Trainer routes under /trainers/me run behind requireAuth +
 * requireTrainer and use the session user as the trainer; client routes
 * under /clients/me use the session user as the client.
 */

const ScheduleInput = z.object({
  start_time: z.coerce.date(),
  duration_in_minutes: z.int().positive(),
});

const RescheduleInput = z.object({
  proposed_start_time: z.coerce.date(),
  proposed_duration_in_minutes: z.int().positive(),
  message: z.string().max(500).optional(),
});

const RescheduleResponseInput = z.object({
  action: z.enum(["accept", "decline"]),
});

const sessionUserId = (req: Request): ObjectId =>
  new ObjectId(req.session.user!.id);

// Maps service errors to HTTP responses; rethrows anything unexpected.
const handleServiceError = (res: Response, err: unknown): void => {
  if (err instanceof scheduleService.ClientNotLinkedError) {
    res.status(404).json({ error: "Client not linked to this trainer." });
  } else if (err instanceof scheduleService.ScheduleNotFoundError) {
    res.status(404).json({ error: "Cannot find schedule." });
  } else if (err instanceof scheduleService.ScheduleAccessError) {
    res.status(403).json({ error: "Forbidden." });
  } else if (err instanceof scheduleService.NoPendingRescheduleError) {
    res
      .status(409)
      .json({ error: "Schedule has no pending reschedule request." });
  } else {
    throw err;
  }
};

// GET /api/trainers/me/schedules
// Every linked client's schedules, merged, for the trainer schedule UI.
export const getTrainerSchedules = async (req: Request, res: Response) => {
  const schedules = await scheduleService.getTrainerSchedules(
    sessionUserId(req),
  );
  res.status(200).json(schedules);
};

// GET /api/clients/me/schedules
// The logged-in client's own schedules, for the client schedule UI.
export const getMySchedules = async (req: Request, res: Response) => {
  const schedules = await scheduleService.getClientSchedules(
    sessionUserId(req),
  );
  res.status(200).json(schedules);
};

// GET /api/clients/:clientId/schedules
// Behind requireClientAccess: the client themself or their linked trainer.
export const getClientSchedules = async (req: Request, res: Response) => {
  // requireClientAccess already validated the id and the caller's access.
  const clientId = parseObjectId(req.params.clientId)!;
  const schedules = await scheduleService.getClientSchedules(clientId);
  res.status(200).json(schedules);
};

// POST /api/clients/:clientId/schedules
// Behind requireClientAccess. A trainer books for a linked client
// (schedule gets their trainer_id); a client books for themself.
export const addClientSchedule = async (req: Request, res: Response) => {
  const clientId = parseObjectId(req.params.clientId)!;

  const result = ScheduleInput.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: "Invalid schedule data." });
  }

  try {
    const schedule =
      req.session.user?.role === "trainer"
        ? await scheduleService.createSchedule(
            sessionUserId(req),
            clientId,
            result.data,
          )
        : await scheduleService.createSelfSchedule(clientId, result.data);

    res.status(201).json(schedule);
  } catch (err) {
    handleServiceError(res, err);
  }
};

// POST /api/trainers/me/schedules/:scheduleId/reschedule-request
// Trainer proposes a new slot; the client accepts or declines.
export const requestReschedule = async (req: Request, res: Response) => {
  const scheduleId = parseObjectId(req.params.scheduleId);

  if (!scheduleId) {
    return res.status(400).json({ error: "Invalid schedule id." });
  }

  const result = RescheduleInput.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: "Invalid reschedule data." });
  }

  try {
    const request = await scheduleService.requestReschedule(
      sessionUserId(req),
      scheduleId,
      result.data,
    );
    res.status(201).json(request);
  } catch (err) {
    handleServiceError(res, err);
  }
};

// POST /api/clients/me/schedules/:scheduleId/reschedule-response
// Client answers a pending reschedule request on their own schedule.
export const respondToReschedule = async (req: Request, res: Response) => {
  const scheduleId = parseObjectId(req.params.scheduleId);

  if (!scheduleId) {
    return res.status(400).json({ error: "Invalid schedule id." });
  }

  const result = RescheduleResponseInput.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: "Invalid reschedule response." });
  }

  try {
    const schedule = await scheduleService.respondToReschedule(
      sessionUserId(req),
      scheduleId,
      result.data.action === "accept",
    );
    res.status(200).json(schedule);
  } catch (err) {
    handleServiceError(res, err);
  }
};

// DELETE /api/schedules/:scheduleId
// Behind requireScheduleAccess, which already 400/404/403s as needed.
export const deleteClientSchedule = async (req: Request, res: Response) => {
  const scheduleId = parseObjectId(req.params.scheduleId)!;
  await scheduleService.deleteSchedule(scheduleId);
  res.status(204).send();
};
