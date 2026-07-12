import { Request, Response, NextFunction } from "express";

// Used for any route that requires the user to be authenticated.
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};
