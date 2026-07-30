import express from "express";
import {
  getClientExerciseTemplates,
  addClientExerciseTemplate,
  updateExerciseTemplate,
  deleteExerciseTemplate,
} from "../controllers/exerciseTemplateController";
import { requireAuth } from "../middleware/requireAuth";
import { requireClientAccess } from "../middleware/requireClientAccess";
import { requireExerciseTemplateAccess } from "../middleware/requireExerciseTemplateAccess";

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
  requireAuth,
  requireClientAccess,
  getClientExerciseTemplates,
);

/**
 * @swagger
 * /api/clients/{clientId}/exercise-templates:
 *   post:
 *     summary: Add a new exercise template to a client
 *     tags: [Exercise Templates]
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - name
 *               properties:
 *                 name:
 *                   type: string
 *     responses:
 *       201:
 *         description: Creates the exercise template for the client and returns it
 *       400:
 *         description: Client id is invalid or name is invalid
 *       404:
 *         description: Cannot find client
 */
exerciseTemplateRouter.post(
  "/clients/:clientId/exercise-templates",
  requireAuth,
  requireClientAccess,
  addClientExerciseTemplate,
);

/**
 * @swagger
 * /api/exercise-templates/{templateId}:
 *   put:
 *     summary: Update a specific exercise template
 *     tags: [Exercise Templates]
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - name
 *               properties:
 *                 name:
 *                   type: string
 *     responses:
 *       200:
 *         description: Updates the exercise template and returns it
 *       400:
 *         description: Template id is invalid or name is invalid
 *       404:
 *         description: Cannot find template
 */
exerciseTemplateRouter.put(
  "/exercise-templates/:templateId",
  requireAuth,
  requireExerciseTemplateAccess,
  updateExerciseTemplate,
);

/**
 * @swagger
 * /api/exercise-templates/{templateId}:
 *   delete:
 *     summary: Delete a specific exercise template
 *     tags: [Exercise Templates]
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Deletes the exercise template
 *       400:
 *         description: Template id is invalid
 *       404:
 *         description: Cannot find template
 */
exerciseTemplateRouter.delete(
  "/exercise-templates/:templateId",
  requireAuth,
  requireExerciseTemplateAccess,
  deleteExerciseTemplate,
);
