import * as workoutSessionModel from "../models/WorkoutSession";
import { requireResourceOwnerAccess } from "./requireResourceOwnerAccess";

// Covers every route with :sessionId in the path, including the nested
// exercise sub-routes, since ownership always comes from the session's own
// client_id, not the exercise.
export const requireWorkoutSessionAccess = requireResourceOwnerAccess(
  "sessionId",
  "Cannot find session.",
  workoutSessionModel.getWorkoutSession,
  (session) => session.client_id,
);
