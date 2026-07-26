import express from "express";
import {
  getClientExerciseTemplates,
  addClientExerciseTemplate,
  updateExerciseTemplate,
  deleteExerciseTemplate,
} from "../controllers/exerciseTemplateController";

export const exerciseTemplateRouter = express.Router();

/**
 * @swagger
 * /api/clients/{clientId}/exercise-templates:
 *   get:
 *     summary: Get exercise templates for a client
 *     tags: [Exercise Templates]
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns all the exercise templates for this client
 *       400:
 *         description: Client id is invalid
 *       404:
 *         description: Cannot find client
 */
exerciseTemplateRouter.get(
  "/clients/:clientId/exercise-templates",
  getClientExerciseTemplates,
);
exerciseTemplateRouter.post(
  "/clients/:clientId/exercise-templates",
  addClientExerciseTemplate,
);

exerciseTemplateRouter.put(
  "/exercise-templates/:templateId",
  updateExerciseTemplate,
);
exerciseTemplateRouter.delete(
  "/exercise-templates/:templateId",
  deleteExerciseTemplate,
);
