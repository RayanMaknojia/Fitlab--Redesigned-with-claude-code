import { Request, Response, NextFunction } from "express";

// Used for trainer-only routes. Must run after requireAuth.
export const requireTrainer = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.session.user?.role !== "trainer") {
    return res.status(403).json({ error: "Trainer role required." });
  }
  next();
};
