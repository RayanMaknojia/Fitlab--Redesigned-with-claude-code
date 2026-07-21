import express from "express";
import {
  addClientSchedule,
  deleteClientSchedule,
  getClientSchedules,
} from "../controllers/schedulesController";

export const scheduleRouter = express.Router();

scheduleRouter.get("/clients/:clientId/schedules", getClientSchedules);
scheduleRouter.post("/clients/:clientId/schedules", addClientSchedule);
scheduleRouter.delete("/schedules/:scheduleId", deleteClientSchedule);
