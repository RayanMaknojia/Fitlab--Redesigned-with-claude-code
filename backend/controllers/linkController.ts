import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import * as linkService from "../services/linkService";
import { parseObjectId } from "../utils/parseObjectId";

/**
 * Controller for the trainer↔client linking flow. Trainer endpoints run
 * behind requireAuth + requireTrainer; client endpoints behind
 * requireAuth + requireClient (see routes/links.ts).
 */

// Maps every linkService error to a status code; rethrows unknown errors.
const handleLinkError = (e: unknown, res: Response): void => {
  if (
    e instanceof linkService.EmailNotFoundError ||
    e instanceof linkService.NotAClientEmailError ||
    e instanceof linkService.NotATrainerEmailError
  ) {
    res.status(400).json({ error: e.message });
    return;
  }

  if (
    e instanceof linkService.AlreadyLinkedError ||
    e instanceof linkService.ClientHasTrainerError ||
    e instanceof linkService.DuplicatePendingRequestError
  ) {
    res.status(409).json({ error: e.message });
    return;
  }

  if (e instanceof linkService.RequestNotFoundError) {
    res.status(404).json({ error: e.message });
    return;
  }

  if (e instanceof linkService.RequestAccessError) {
    res.status(403).json({ error: e.message });
    return;
  }

  if (e instanceof linkService.NotLinkedError) {
    res.status(404).json({ error: e.message });
    return;
  }

  throw e;
};

const sessionUserId = (req: Request): ObjectId =>
  new ObjectId(req.session.user!.id);

// Shared accept/decline handler; `accept` decides the action.
const respond = async (req: Request, res: Response, accept: boolean) => {
  const requestId = parseObjectId(req.params.requestId);

  if (!requestId) {
    return res.status(400).json({ error: "Invalid request id." });
  }

  try {
    const view = await linkService.respondToRequest(
      sessionUserId(req),
      requestId,
      accept,
    );
    res.status(200).json(view);
  } catch (e) {
    handleLinkError(e, res);
  }
};

// --- trainer side ---

// POST /api/trainers/me/link-requests  { client_email }
export const sendRequestToClient = async (req: Request, res: Response) => {
  const { client_email } = req.body;

  if (typeof client_email !== "string" || !client_email.trim()) {
    return res.status(400).json({ error: "A client email is required." });
  }

  try {
    const view = await linkService.sendRequestToClient(
      sessionUserId(req),
      client_email,
    );
    res.status(201).json(view);
  } catch (e) {
    handleLinkError(e, res);
  }
};

// GET /api/trainers/me/link-requests
export const getTrainerRequests = async (req: Request, res: Response) => {
  const views = await linkService.getPendingRequestsForTrainer(
    sessionUserId(req),
  );
  res.status(200).json(views);
};

// POST /api/trainers/me/link-requests/:requestId/accept
export const trainerAcceptRequest = (req: Request, res: Response) =>
  respond(req, res, true);

// POST /api/trainers/me/link-requests/:requestId/decline
export const trainerDeclineRequest = (req: Request, res: Response) =>
  respond(req, res, false);

// DELETE /api/trainers/me/clients/:clientId
export const unlinkClient = async (req: Request, res: Response) => {
  const clientId = parseObjectId(req.params.clientId);

  if (!clientId) {
    return res.status(400).json({ error: "Invalid client id." });
  }

  try {
    await linkService.unlinkClientFromTrainer(sessionUserId(req), clientId);
    res.status(204).end();
  } catch (e) {
    handleLinkError(e, res);
  }
};

// --- client side ---

// POST /api/clients/me/link-requests  { trainer_email }
export const sendRequestToTrainer = async (req: Request, res: Response) => {
  const { trainer_email } = req.body;

  if (typeof trainer_email !== "string" || !trainer_email.trim()) {
    return res.status(400).json({ error: "A trainer email is required." });
  }

  try {
    const view = await linkService.sendRequestToTrainer(
      sessionUserId(req),
      trainer_email,
    );
    res.status(201).json(view);
  } catch (e) {
    handleLinkError(e, res);
  }
};

// GET /api/clients/me/link-requests
export const getClientRequests = async (req: Request, res: Response) => {
  const views = await linkService.getPendingRequestsForClient(
    sessionUserId(req),
  );
  res.status(200).json(views);
};

// POST /api/clients/me/link-requests/:requestId/accept
export const clientAcceptRequest = (req: Request, res: Response) =>
  respond(req, res, true);

// POST /api/clients/me/link-requests/:requestId/decline
export const clientDeclineRequest = (req: Request, res: Response) =>
  respond(req, res, false);

// GET /api/clients/me/trainer
export const getMyTrainer = async (req: Request, res: Response) => {
  const trainer = await linkService.getLinkedTrainer(sessionUserId(req));
  res.status(200).json({ trainer });
};

// DELETE /api/clients/me/trainer
export const unlinkTrainer = async (req: Request, res: Response) => {
  try {
    await linkService.unlinkTrainerFromClient(sessionUserId(req));
    res.status(204).end();
  } catch (e) {
    handleLinkError(e, res);
  }
};
