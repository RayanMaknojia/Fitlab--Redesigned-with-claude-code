import express from "express";
import {
  getMyWorkoutSessions,
  getClientWorkoutSessions,
  addClientWorkoutSession,
  getWorkoutSessionById,
  updateWorkoutSession,
  deleteWorkoutSession,
  getWorkoutSessionExercises,
  addSessionExercise,
  updateSessionExercise,
  deleteSessionExercise,
} from "../controllers/workoutSessionController";
import { requireAuth } from "../middleware/requireAuth";
import { requireClientAccess } from "../middleware/requireClientAccess";
import { requireWorkoutSessionAccess } from "../middleware/requireWorkoutSessionAccess";

export const workoutSessionRouter = express.Router();

workoutSessionRouter.get(
  "/me/workout-sessions",
  requireAuth,
  getMyWorkoutSessions,
);

/**
 * @swagger
 * /api/clients/{clientId}/workout-sessions:
 *   get:
 *     summary: Return all of a client's workout sessions
 *     tags: [Workout Sessions]
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns all of the client's sessions
 *       400:
 *         description: Client id is invalid
 *       404:
 *         description: Cannot find client
 */
workoutSessionRouter.get(
  "/clients/:clientId/workout-sessions",
  requireAuth,
  requireClientAccess,
  getClientWorkoutSessions,
);

/**
 * @swagger
 * /api/clients/{clientId}/workout-sessions:
 *   post:
 *     summary: Add a session to a client
 *     tags: [Workout Sessions]
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
 *                 - session_date
 *               properties:
 *                 session_date:
 *                   type: string
 *     responses:
 *       201:
 *         description: Creates a session and returns it
 *       400:
 *         description: Client id is invalid or date is invalid
 *       404:
 *         description: Cannot find client
 */
workoutSessionRouter.post(
  "/clients/:clientId/workout-sessions",
  requireAuth,
  requireClientAccess,
  addClientWorkoutSession,
);

/**
 * @swagger
 * /api/workout-sessions/{sessionId}:
 *   get:
 *     summary: Gets a specific session
 *     tags: [Workout Sessions]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns the session
 *       400:
 *         description: Session id is invalid
 *       404:
 *         description: Cannot find session
 */
workoutSessionRouter.get(
  "/workout-sessions/:sessionId",
  requireAuth,
  requireWorkoutSessionAccess,
  getWorkoutSessionById,
);

/**
 * @swagger
 * /api/workout-sessions/{sessionId}:
 *   put:
 *     summary: Update a specific session
 *     tags: [Workout Sessions]
 *     parameters:
 *       - in: path
 *         name: sessionId
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
 *                 - session_date
 *               properties:
 *                 session_date:
 *                   type: string
 *     responses:
 *       200:
 *         description: Updates the session and returns it
 *       400:
 *         description: Session id is invalid or date is invalid
 *       404:
 *         description: Cannot find session
 */
workoutSessionRouter.put(
  "/workout-sessions/:sessionId",
  requireAuth,
  requireWorkoutSessionAccess,
  updateWorkoutSession,
);

/**
 * @swagger
 * /api/workout-sessions/{sessionId}:
 *   delete:
 *     summary: Delete a specific session
 *     tags: [Workout Sessions]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Deletes the session
 *       400:
 *         description: Session id is invalid
 *       404:
 *         description: Cannot find session
 */
workoutSessionRouter.delete(
  "/workout-sessions/:sessionId",
  requireAuth,
  requireWorkoutSessionAccess,
  deleteWorkoutSession,
);

/**
 * @swagger
 * /api/workout-sessions/{sessionId}/exercises:
 *   get:
 *     summary: Get a specific session's exercises
 *     tags: [Session Exercises]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns the session's exercises
 *       400:
 *         description: Session id is invalid
 *       404:
 *         description: Cannot find session
 */
workoutSessionRouter.get(
  "/workout-sessions/:sessionId/exercises",
  requireAuth,
  requireWorkoutSessionAccess,
  getWorkoutSessionExercises,
);

/**
 * @swagger
 * /api/workout-sessions/{sessionId}/exercises:
 *   post:
 *     summary: Add an exercise to a session
 *     tags: [Session Exercises]
 *     parameters:
 *       - in: path
 *         name: sessionId
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
 *                 - exercise_template_id
 *                 - sets
 *                 - reps
 *               properties:
 *                 exercise_template_id:
 *                   type: string
 *                 sets:
 *                   type: integer
 *                 reps:
 *                   type: integer
 *                 weight_in_kg:
 *                   type: integer
 *                   default: 0
 *     responses:
 *       201:
 *         description: Creates an exercise and returns it
 *       400:
 *         description: Session id is invalid or exercise data is invalid or template does not belong to this client
 *       404:
 *         description: Cannot find session or exercise template
 */
workoutSessionRouter.post(
  "/workout-sessions/:sessionId/exercises",
  requireAuth,
  requireWorkoutSessionAccess,
  addSessionExercise,
);

/**
 * @swagger
 * /api/workout-sessions/{sessionId}/exercises/{exerciseId}:
 *   put:
 *     summary: Update an exercise
 *     tags: [Session Exercises]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: exerciseId
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
 *                 - sets
 *                 - reps
 *               properties:
 *                 sets:
 *                   type: integer
 *                 reps:
 *                   type: integer
 *                 weight_in_kg:
 *                   type: integer
 *                   default: 0
 *     responses:
 *       200:
 *         description: Updates the exercise and returns it
 *       400:
 *         description: Session id is invalid or exercise id is invalid or exercise data is invalid
 *       404:
 *         description: Cannot find session or exercise
 */
workoutSessionRouter.put(
  "/workout-sessions/:sessionId/exercises/:exerciseId",
  requireAuth,
  requireWorkoutSessionAccess,
  updateSessionExercise,
);

/**
 * @swagger
 * /api/workout-sessions/{sessionId}/exercises/{exerciseId}:
 *   delete:
 *     summary: Delete an exercise
 *     tags: [Session Exercises]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: exerciseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Deletes an exercise
 *       400:
 *         description: Session id is invalid or exercise id is invalid
 *       404:
 *         description: Cannot find session or exercise
 */
workoutSessionRouter.delete(
  "/workout-sessions/:sessionId/exercises/:exerciseId",
  requireAuth,
  requireWorkoutSessionAccess,
  deleteSessionExercise,
);
