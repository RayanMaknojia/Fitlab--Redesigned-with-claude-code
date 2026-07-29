import express from "express";
import {
  getMyClients,
  syncClientData,
  getLinkedClientSessions,
  getLinkedClientProgress,
} from "../controllers/dataSyncController";
import { requireAuth } from "../middleware/requireAuth";
import { requireTrainer } from "../middleware/requireTrainer";

// DataSyncupService routes: trainer-only, read-only endpoints for pulling
// a linked client's data into the trainer's UI.
export const dataSyncRouter = express.Router();

dataSyncRouter.use("/trainers/me", requireAuth, requireTrainer);

/**
 * @swagger
 * /api/trainers/me/clients:
 *   get:
 *     summary: List the logged-in trainer's linked clients with a session summary
 *     tags: [Data Sync]
 *     responses:
 *       200:
 *         description: Array of linked clients (empty if none are linked)
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Logged-in user is not a trainer
 */
dataSyncRouter.get("/trainers/me/clients", getMyClients);

/**
 * @swagger
 * /api/trainers/me/clients/{clientId}/sync:
 *   get:
 *     summary: Full data sync for a linked client (profile, session history, progress)
 *     tags: [Data Sync]
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Full sync payload for the client
 *       400:
 *         description: Client id is invalid
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Logged-in user is not a trainer
 *       404:
 *         description: Client not found or not linked to this trainer
 */
dataSyncRouter.get("/trainers/me/clients/:clientId/sync", syncClientData);

/**
 * @swagger
 * /api/trainers/me/clients/{clientId}/workout-sessions:
 *   get:
 *     summary: A linked client's workout session history with exercises
 *     tags: [Data Sync]
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session history, newest first
 *       400:
 *         description: Client id is invalid
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Logged-in user is not a trainer
 *       404:
 *         description: Client not found or not linked to this trainer
 */
dataSyncRouter.get(
  "/trainers/me/clients/:clientId/workout-sessions",
  getLinkedClientSessions,
);

/**
 * @swagger
 * /api/trainers/me/clients/{clientId}/progress:
 *   get:
 *     summary: Per-exercise progress stats for a linked client
 *     tags: [Data Sync]
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Progress stats grouped by exercise
 *       400:
 *         description: Client id is invalid
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Logged-in user is not a trainer
 *       404:
 *         description: Client not found or not linked to this trainer
 */
dataSyncRouter.get(
  "/trainers/me/clients/:clientId/progress",
  getLinkedClientProgress,
);
