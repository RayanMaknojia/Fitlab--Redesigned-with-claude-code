import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import * as clientModel from "../models/Client";
import { parseObjectId } from "./parseObjectId";
import type { SessionUser } from "../types";

export const canAccessClient = async (
  user: SessionUser,
  clientId: ObjectId,
): Promise<boolean> => {
  if (user.id === clientId.toString()) {
    return true;
  }

  if (user.role !== "trainer") {
    return false;
  }

  const client = await clientModel.getClient(clientId);
  return client?.trainer_id?.toString() === user.id;
};

// Builds middleware for routes where a resource id (not a clientId) is in the
// URL, e.g. :sessionId or :templateId. Fetches the resource, 404s if it
// doesn't exist, then checks the caller can access the client it belongs to.
export const requireResourceOwnerAccess = <T>(
  paramName: string,
  notFoundMessage: string,
  fetchResource: (id: ObjectId) => Promise<T | null>,
  getClientId: (resource: T) => ObjectId,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const id = parseObjectId(req.params[paramName]);
    if (!id) {
      return res.status(400).json({ error: `Invalid ${paramName}.` });
    }

    const resource = await fetchResource(id);
    if (!resource) {
      return res.status(404).json({ error: notFoundMessage });
    }

    if (!(await canAccessClient(req.session.user!, getClientId(resource)))) {
      return res.status(403).json({ error: "Forbidden." });
    }

    next();
  };
};
