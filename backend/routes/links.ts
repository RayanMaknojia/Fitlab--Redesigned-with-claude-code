import express from "express";
import {
  clientAcceptRequest,
  clientDeclineRequest,
  getClientRequests,
  getMyTrainer,
  getTrainerRequests,
  sendRequestToClient,
  sendRequestToTrainer,
  trainerAcceptRequest,
  trainerDeclineRequest,
  unlinkClient,
  unlinkTrainer,
} from "../controllers/linkController";
import { requireAuth } from "../middleware/requireAuth";
import { requireClient } from "../middleware/requireClient";
import { requireTrainer } from "../middleware/requireTrainer";

// LinkService routes: the trainer↔client linking flow. Either side sends a
// request by the other side's email; the other side accepts or declines.
export const linkRouter = express.Router();

linkRouter.use("/trainers/me", requireAuth, requireTrainer);
linkRouter.use("/clients/me", requireAuth, requireClient);

/**
 * @swagger
 * /api/trainers/me/link-requests:
 *   post:
 *     summary: Trainer sends a link request to a client by email
 *     tags: [Links]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - client_email
 *             properties:
 *               client_email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pending link request created and returned
 *       400:
 *         description: Email missing, not registered, or not a client's email
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Logged-in user is not a trainer
 *       409:
 *         description: Already linked, client has another trainer, or a request is already pending
 */
linkRouter.post("/trainers/me/link-requests", sendRequestToClient);

/**
 * @swagger
 * /api/trainers/me/link-requests:
 *   get:
 *     summary: All pending link requests involving the logged-in trainer
 *     tags: [Links]
 *     responses:
 *       200:
 *         description: Pending requests, both sent and received (empty if none)
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Logged-in user is not a trainer
 */
linkRouter.get("/trainers/me/link-requests", getTrainerRequests);

/**
 * @swagger
 * /api/trainers/me/link-requests/{requestId}/accept:
 *   post:
 *     summary: Trainer accepts a client-initiated link request
 *     tags: [Links]
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request accepted; the client is now linked to this trainer
 *       400:
 *         description: Request id is invalid
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not a trainer, or not the receiving side of this request
 *       404:
 *         description: No pending request with that id
 *       409:
 *         description: The client linked with another trainer in the meantime
 */
linkRouter.post(
  "/trainers/me/link-requests/:requestId/accept",
  trainerAcceptRequest,
);

/**
 * @swagger
 * /api/trainers/me/link-requests/{requestId}/decline:
 *   post:
 *     summary: Trainer declines a client-initiated link request
 *     tags: [Links]
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request declined
 *       400:
 *         description: Request id is invalid
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not a trainer, or not the receiving side of this request
 *       404:
 *         description: No pending request with that id
 */
linkRouter.post(
  "/trainers/me/link-requests/:requestId/decline",
  trainerDeclineRequest,
);

/**
 * @swagger
 * /api/trainers/me/clients/{clientId}:
 *   delete:
 *     summary: Trainer unlinks one of their clients
 *     tags: [Links]
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Link removed
 *       400:
 *         description: Client id is invalid
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Logged-in user is not a trainer
 *       404:
 *         description: Client is not linked to this trainer
 */
linkRouter.delete("/trainers/me/clients/:clientId", unlinkClient);

/**
 * @swagger
 * /api/clients/me/link-requests:
 *   post:
 *     summary: Client sends a link request to a trainer by email
 *     tags: [Links]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trainer_email
 *             properties:
 *               trainer_email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pending link request created and returned
 *       400:
 *         description: Email missing, not registered, or not a trainer's email
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Logged-in user is not a client
 *       409:
 *         description: Already linked with a trainer, or a request is already pending
 */
linkRouter.post("/clients/me/link-requests", sendRequestToTrainer);

/**
 * @swagger
 * /api/clients/me/link-requests:
 *   get:
 *     summary: All pending link requests involving the logged-in client
 *     tags: [Links]
 *     responses:
 *       200:
 *         description: Pending requests, both sent and received (empty if none)
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Logged-in user is not a client
 */
linkRouter.get("/clients/me/link-requests", getClientRequests);

/**
 * @swagger
 * /api/clients/me/link-requests/{requestId}/accept:
 *   post:
 *     summary: Client accepts a trainer-initiated link request
 *     tags: [Links]
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request accepted; this client is now linked to the trainer
 *       400:
 *         description: Request id is invalid
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not a client, or not the receiving side of this request
 *       404:
 *         description: No pending request with that id
 *       409:
 *         description: Already linked with a trainer
 */
linkRouter.post(
  "/clients/me/link-requests/:requestId/accept",
  clientAcceptRequest,
);

/**
 * @swagger
 * /api/clients/me/link-requests/{requestId}/decline:
 *   post:
 *     summary: Client declines a trainer-initiated link request
 *     tags: [Links]
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request declined
 *       400:
 *         description: Request id is invalid
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not a client, or not the receiving side of this request
 *       404:
 *         description: No pending request with that id
 */
linkRouter.post(
  "/clients/me/link-requests/:requestId/decline",
  clientDeclineRequest,
);

/**
 * @swagger
 * /api/clients/me/trainer:
 *   get:
 *     summary: The logged-in client's linked trainer (null when unlinked)
 *     tags: [Links]
 *     responses:
 *       200:
 *         description: "{ trainer } with id, name and email, or { trainer: null }"
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Logged-in user is not a client
 */
linkRouter.get("/clients/me/trainer", getMyTrainer);

/**
 * @swagger
 * /api/clients/me/trainer:
 *   delete:
 *     summary: Client unlinks from their trainer
 *     tags: [Links]
 *     responses:
 *       204:
 *         description: Link removed
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Logged-in user is not a client
 *       404:
 *         description: Client has no linked trainer
 */
linkRouter.delete("/clients/me/trainer", unlinkTrainer);
