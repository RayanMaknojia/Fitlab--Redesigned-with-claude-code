import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import * as dataSyncupService from "../services/dataSyncupService";
import { parseObjectId } from "../utils/parseObjectId";

/**
 * Controller for DataSyncupService endpoints. Link authorization lives in
 * the requireLinkedClient middleware (see routes/dataSync.ts), matching
 * the middleware pattern used by the schedule routes — by the time a
 * handler runs, :clientId is valid and linked to the logged-in trainer.
 */

// GET /api/trainers/me/clients
export const getMyClients = async (req: Request, res: Response) => {
  const trainerId = new ObjectId(req.session.user!.id);
  const clients = await dataSyncupService.getLinkedClients(trainerId);
  res.status(200).json(clients);
};

// GET /api/trainers/me/clients/:clientId/sync
export const syncClientData = async (req: Request, res: Response) => {
  const clientId = parseObjectId(req.params.clientId)!;
  const data = await dataSyncupService.getClientSyncData(clientId);

  if (!data) {
    return res.status(404).json({ error: "Cannot find client." });
  }

  res.status(200).json(data);
};

// GET /api/trainers/me/clients/:clientId/workout-sessions
export const getLinkedClientSessions = async (req: Request, res: Response) => {
  const clientId = parseObjectId(req.params.clientId)!;
  const sessions = await dataSyncupService.getClientSessionHistory(clientId);
  res.status(200).json(sessions);
};

// GET /api/trainers/me/clients/:clientId/progress
export const getLinkedClientProgress = async (req: Request, res: Response) => {
  const clientId = parseObjectId(req.params.clientId)!;
  const progress = await dataSyncupService.getClientProgress(clientId);
  res.status(200).json(progress);
};
