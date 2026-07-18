import express from "express";
import { getClientSchedules } from "../controllers/schedulesController";

export const scheduleRouter = express.Router();

// all of a client's schedules
scheduleRouter.get("/clients/:clientId/schedules", getClientSchedules);
