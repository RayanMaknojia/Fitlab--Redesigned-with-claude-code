import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import * as dataSyncupService from "../services/dataSyncupService";
import { parseObjectId } from "../utils/parseObjectId";

/**
 * Controller for DataSyncupService endpoints. Every clientId-scoped
 * handler verifies the client is linked to the logged-in trainer
 * before returning any data.
 */

// Parses :clientId and verifies the link. Sends the error response and
// returns null when the request should not proceed.
const authorizeClientAccess = async (
  req: Request,
  res: Response,
): Promise<ObjectId | null> => {
  const clientId = parseObjectId(req.params.clientId);

  if (!clientId) {
    res.status(400).json({ error: "Invalid client id." });
    return null;
  }

  const trainerId = new ObjectId(req.session.user!.id);
  const linked = await clientModelLinked(trainerId, clientId);

  if (!linked) {
    res.status(404).json({ error: "Client not linked to this trainer." });
    return null;
  }

  return clientId;
};

const clientModelLinked = async (
  trainerId: ObjectId,
  clientId: ObjectId,
): Promise<boolean> => {
  try {
    await dataSyncupService.assertLinked(trainerId, clientId);
    return true;
  } catch (e) {
    if (e instanceof dataSyncupService.ClientNotLinkedError) {
      return false;
    }
    throw e;
  }
};

// GET /api/trainers/me/clients
export const getMyClients = async (req: Request, res: Response) => {
  const trainerId = new ObjectId(req.session.user!.id);
  const clients = await dataSyncupService.getLinkedClients(trainerId);
  res.status(200).json(clients);
};

// GET /api/trainers/me/clients/:clientId/sync
export const syncClientData = async (req: Request, res: Response) => {
  const clientId = await authorizeClientAccess(req, res);
  if (!clientId) return;

  const data = await dataSyncupService.getClientSyncData(clientId);

  if (!data) {
    return res.status(404).json({ error: "Cannot find client." });
  }

  res.status(200).json(data);
};

// GET /api/trainers/me/clients/:clientId/workout-sessions
export const getLinkedClientSessions = async (req: Request, res: Response) => {
  const clientId = await authorizeClientAccess(req, res);
  if (!clientId) return;

  const sessions = await dataSyncupService.getClientSessionHistory(clientId);
  res.status(200).json(sessions);
};

// GET /api/trainers/me/clients/:clientId/progress
export const getLinkedClientProgress = async (req: Request, res: Response) => {
  const clientId = await authorizeClientAccess(req, res);
  if (!clientId) return;

  const progress = await dataSyncupService.getClientProgress(clientId);
  res.status(200).json(progress);
};
