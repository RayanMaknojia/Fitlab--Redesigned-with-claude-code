import express from "express";
import {
  addClientSchedule,
  deleteClientSchedule,
  getClientSchedules,
  getMySchedules,
  getTrainerSchedules,
  requestReschedule,
  respondToReschedule,
} from "../controllers/schedulesController";
import { requireAuth } from "../middleware/requireAuth";
import { requireClientAccess } from "../middleware/requireClientAccess";
import { requireScheduleAccess } from "../middleware/requireScheduleAccess";
import { requireTrainer } from "../middleware/requireTrainer";

// ScheduleService routes.
// Trainer endpoints live under /trainers/me (trainer-only; the service
// verifies the target client/schedule is linked to the trainer). Client
// endpoints live under /clients/me and act on the session user. The
// :clientId/:scheduleId routes are guarded by ownership middleware.
export const scheduleRouter = express.Router();

scheduleRouter.use("/trainers/me", requireAuth, requireTrainer);
scheduleRouter.use("/clients/me", requireAuth);

/**
 * @swagger
 * /api/trainers/me/schedules:
 *   get:
 *     summary: All schedules of every client linked to the logged-in trainer
 *     tags: [Schedules]
 *     responses:
 *       200:
 *         description: Merged schedule list with client names, sorted by start time (empty if no linked clients)
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Logged-in user is not a trainer
 */
scheduleRouter.get("/trainers/me/schedules", getTrainerSchedules);

/**
 * @swagger
 * /api/trainers/me/schedules/{scheduleId}/reschedule-request:
 *   post:
 *     summary: Trainer proposes a new time slot; the client must accept or decline
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - proposed_start_time
 *               - proposed_duration_in_minutes
 *             properties:
 *               proposed_start_time:
 *                 type: string
 *                 format: date-time
 *               proposed_duration_in_minutes:
 *                 type: integer
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Creates (or replaces) the pending reschedule request and returns it
 *       400:
 *         description: Schedule id or reschedule data is invalid
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not a trainer, or schedule's client is not linked to this trainer
 *       404:
 *         description: Cannot find schedule
 */
scheduleRouter.post(
  "/trainers/me/schedules/:scheduleId/reschedule-request",
  requestReschedule,
);

/**
 * @swagger
 * /api/clients/me/schedules:
 *   get:
 *     summary: The logged-in client's schedules
 *     tags: [Schedules]
 *     responses:
 *       200:
 *         description: The client's schedules with trainer names and any reschedule requests
 *       401:
 *         description: Not authenticated
 */
scheduleRouter.get("/clients/me/schedules", getMySchedules);

/**
 * @swagger
 * /api/clients/me/schedules/{scheduleId}/reschedule-response:
 *   post:
 *     summary: Client accepts or declines a pending reschedule request
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [accept, decline]
 *     responses:
 *       200:
 *         description: Returns the updated schedule (moved to the proposed slot when accepted)
 *       400:
 *         description: Schedule id or action is invalid
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Schedule does not belong to the logged-in client
 *       404:
 *         description: Cannot find schedule
 *       409:
 *         description: Schedule has no pending reschedule request
 */
scheduleRouter.post(
  "/clients/me/schedules/:scheduleId/reschedule-response",
  respondToReschedule,
);

/**
 * @swagger
 * /api/clients/{clientId}/schedules:
 *   get:
 *     summary: Get a client's schedules
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns a client's schedules
 *       400:
 *         description: Client id is invalid
 *       404:
 *         description: Cannot find client
 */
scheduleRouter.get(
  "/clients/:clientId/schedules",
  requireAuth,
  requireClientAccess,
  getClientSchedules,
);

/**
 * @swagger
 * /api/clients/{clientId}/schedules:
 *   post:
 *     summary: Add a schedule to a client
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - start_time
 *                 - duration_in_minutes
 *               properties:
 *                 start_time:
 *                   type: string
 *                 duration_in_minutes:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Creates a schedule and returns it
 *       400:
 *         description: Client id is invalid or schedule data is invalid
 *       404:
 *         description: Cannot find client
 */
scheduleRouter.post(
  "/clients/:clientId/schedules",
  requireAuth,
  requireClientAccess,
  addClientSchedule,
);

/**
 * @swagger
 * /api/schedules/{scheduleId}:
 *   delete:
 *     summary: Delete a schedule
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Deletes the schedule
 *       400:
 *         description: Schedule id is invalid
 *       404:
 *         description: Cannot find schedule
 */
scheduleRouter.delete(
  "/schedules/:scheduleId",
  requireAuth,
  requireScheduleAccess,
  deleteClientSchedule,
);
