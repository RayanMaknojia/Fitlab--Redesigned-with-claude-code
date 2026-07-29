import * as scheduleModel from "../models/Schedule";
import { requireResourceOwnerAccess } from "../utils/clientAccess";

export const requireScheduleAccess = requireResourceOwnerAccess(
  "scheduleId",
  "Cannot find schedule.",
  scheduleModel.getScheduleById,
  (schedule) => schedule.client_id,
);
