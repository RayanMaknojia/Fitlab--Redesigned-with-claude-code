import express from "express";
import {
  getClientExerciseTemplates,
  addClientExerciseTemplate,
  updateExerciseTemplate,
  deleteExerciseTemplate,
} from "../controllers/exerciseTemplateController";

export const exerciseTemplateRouter = express.Router();

exerciseTemplateRouter.get("/clients/:clientId/exercise-templates", getClientExerciseTemplates);
exerciseTemplateRouter.post("/clients/:clientId/exercise-templates", addClientExerciseTemplate);

exerciseTemplateRouter.put("/exercise-templates/:templateId", updateExerciseTemplate);
exerciseTemplateRouter.delete("/exercise-templates/:templateId", deleteExerciseTemplate);
