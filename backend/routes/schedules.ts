import express from "express";
import {
  addClientSchedule,
  deleteClientSchedule,
  getClientSchedules,
} from "../controllers/schedulesController";
import { requireAuth } from "../middleware/requireAuth";
import { requireClientAccess } from "../middleware/requireClientAccess";
import { requireScheduleAccess } from "../middleware/requireScheduleAccess";

export const scheduleRouter = express.Router();

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
