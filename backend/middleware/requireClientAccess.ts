import { Request, Response, NextFunction } from "express";
import * as userModel from "../models/User";
import { canAccessClient } from "../utils/clientAccess";
import { parseObjectId } from "../utils/parseObjectId";

// Compose after requireAuth on routes with :clientId in the path.
export const requireClientAccess = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const client_id = parseObjectId(req.params.clientId);
  if (!client_id) {
    return res.status(400).json({ error: "Invalid client id." });
  }

  const exists = await userModel.userExists(client_id);
  if (!exists) {
    return res.status(404).json({ error: "Cannot find client." });
  }

  if (!(await canAccessClient(req.session.user!, client_id))) {
    return res.status(403).json({ error: "Forbidden." });
  }

  next();
};
