import express from "express";
import {
  addClientSchedule,
  getClientSchedules,
} from "../controllers/schedulesController";

export const scheduleRouter = express.Router();

// get all of a client's schedules
scheduleRouter.get("/clients/:clientId/schedules", getClientSchedules);
scheduleRouter.post("/clients/:clientId/schedules", addClientSchedule);
