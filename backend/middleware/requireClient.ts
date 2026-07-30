import { Request, Response, NextFunction } from "express";

// Used for client-only routes (e.g. /clients/me/*). Must run after requireAuth.
export const requireClient = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.session.user?.role !== "client") {
    return res.status(403).json({ error: "Client role required." });
  }
  next();
};
