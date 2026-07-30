import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import * as clientModel from "../models/Client";
import { parseObjectId } from "../utils/parseObjectId";

/**
 * Guards trainer routes with :clientId in the path: the client must exist
 * AND be linked to the logged-in trainer. Compose after requireAuth and
 * requireTrainer. Responds 404 (not 403) for unlinked clients so the
 * route doesn't reveal which client ids exist.
 */
export const requireLinkedClient = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const clientId = parseObjectId(req.params.clientId);

  if (!clientId) {
    return res.status(400).json({ error: "Invalid client id." });
  }

  const trainerId = new ObjectId(req.session.user!.id);
  const linked = await clientModel.isLinkedToTrainer(clientId, trainerId);

  if (!linked) {
    return res.status(404).json({ error: "Client not linked to this trainer." });
  }

  next();
};
