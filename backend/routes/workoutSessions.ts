import express from "express";
import {
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

export const workoutSessionRouter = express.Router();

workoutSessionRouter.get("/clients/:clientId/workout-sessions", getClientWorkoutSessions);
workoutSessionRouter.post("/clients/:clientId/workout-sessions", addClientWorkoutSession);

workoutSessionRouter.get("/workout-sessions/:sessionId", getWorkoutSessionById);
workoutSessionRouter.put("/workout-sessions/:sessionId", updateWorkoutSession);
workoutSessionRouter.delete("/workout-sessions/:sessionId", deleteWorkoutSession);

workoutSessionRouter.get("/workout-sessions/:sessionId/exercises", getWorkoutSessionExercises);
workoutSessionRouter.post("/workout-sessions/:sessionId/exercises", addSessionExercise);

workoutSessionRouter.put(
  "/workout-sessions/:sessionId/exercises/:exerciseId",
  updateSessionExercise,
);
workoutSessionRouter.delete(
  "/workout-sessions/:sessionId/exercises/:exerciseId",
  deleteSessionExercise,
);
