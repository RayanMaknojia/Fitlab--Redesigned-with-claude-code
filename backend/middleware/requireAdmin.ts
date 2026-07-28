import { Request, Response, NextFunction } from "express";

// Compose after requireAuth on a route; assumes req.session.user is already set.
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};
