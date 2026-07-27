import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import * as z from "zod";
import * as userModel from "../models/User";
import * as workoutSessionModel from "../models/WorkoutSession";
import * as exerciseTemplateModel from "../models/ExerciseTemplate";
import * as sessionExerciseModel from "../models/SessionExercise";
import { parseObjectId } from "../utils/parseObjectId";

const SessionInput = z.object({
  session_date: z.coerce.date(),
});

export const getMyWorkoutSessions = async (req: Request, res: Response) => {
  const client_id = new ObjectId(req.session.user!.id);

  const sessions = await workoutSessionModel.getClientSessions(client_id);

  const withExercises = await Promise.all(
    sessions.map(async (session) => {
      const exercises =
        await sessionExerciseModel.getSessionExercisesAndTemplateNames(
          session._id!,
        );
      return {
        session_id: session._id!.toString(),
        client_id: session.client_id.toString(),
        session_date: session.session_date.toISOString(),
        exercises: exercises.map((e) => ({
          name: e.template_name,
          sets: e.sets,
          reps: e.reps,
          weight_in_kg: e.weight_in_kg,
        })),
      };
    }),
  );

  res.json(withExercises);
};

export const getClientWorkoutSessions = async (req: Request, res: Response) => {
  const client_id = parseObjectId(req.params.clientId);

  if (!client_id) {
    return res.status(400).json({ error: "Invalid client id." });
  }

  const userExists = await userModel.userExists(client_id);

  if (!userExists) {
    return res.status(404).json({ error: "Cannot find client." });
  }

  const sessions = await workoutSessionModel.getClientSessions(client_id);
  res.status(200).json(sessions);
};

export const addClientWorkoutSession = async (req: Request, res: Response) => {
  const client_id = parseObjectId(req.params.clientId);

  if (!client_id) {
    return res.status(400).json({ error: "Invalid client id." });
  }

  const result = SessionInput.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: "Invalid date." });
  }

  const userExists = await userModel.userExists(client_id);

  if (!userExists) {
    return res.status(404).json({ error: "Cannot find client." });
  }

  const { session_date } = result.data;

  const resultId = await workoutSessionModel.addWorkoutSession({
    client_id,
    session_date,
  });

  res.status(201).json({ _id: resultId, client_id, session_date });
};

export const getWorkoutSessionById = async (req: Request, res: Response) => {
  const session_id = parseObjectId(req.params.sessionId);

  if (!session_id) {
    return res.status(400).json({ error: "Invalid session id." });
  }

  const session = await workoutSessionModel.getWorkoutSession(session_id);

  if (!session) {
    return res.status(404).json({ error: "Cannot find session." });
  }

  res.status(200).json(session);
};

export const updateWorkoutSession = async (req: Request, res: Response) => {
  const result = SessionInput.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: "Invalid date." });
  }

  const sessionId = parseObjectId(req.params.sessionId);

  if (!sessionId) {
    return res.status(400).json({ error: "Invalid session id." });
  }

  const session = await workoutSessionModel.getWorkoutSession(sessionId);

  if (!session) {
    return res.status(404).json({ error: "Cannot find session." });
  }

  await workoutSessionModel.updateSessionById(
    sessionId,
    result.data.session_date,
  );

  res.status(200).json({
    _id: sessionId,
    client_id: session.client_id,
    session_date: result.data.session_date,
  });
};

export const deleteWorkoutSession = async (req: Request, res: Response) => {
  const sessionId = parseObjectId(req.params.sessionId);

  if (!sessionId) {
    return res.status(400).json({ error: "Invalid session id." });
  }

  const session = await workoutSessionModel.getWorkoutSession(sessionId);

  if (!session) {
    return res.status(404).json({ error: "Cannot find session." });
  }

  await workoutSessionModel.deleteSessionById(sessionId);

  res.status(204).send();
};

export const getWorkoutSessionExercises = async (
  req: Request,
  res: Response,
) => {
  const session_id = parseObjectId(req.params.sessionId);

  if (!session_id) {
    return res.status(400).json({ error: "Invalid session id." });
  }

  const session = await workoutSessionModel.getWorkoutSession(session_id);

  if (!session) {
    return res.status(404).json({ error: "Cannot find session." });
  }

  const exercises =
    await sessionExerciseModel.getSessionExercisesAndTemplateNames(session._id);
  res.status(200).json(exercises);
};

const SessionExerciseInput = z.object({
  exercise_template_id: z
    .string()
    .refine((id) => ObjectId.isValid(id))
    .transform((id) => new ObjectId(id)),
  sets: z.int().positive(),
  reps: z.int().positive(),
  weight_in_kg: z.int().nonnegative().default(0),
});

export const addSessionExercise = async (req: Request, res: Response) => {
  const session_id = parseObjectId(req.params.sessionId);
  if (!session_id) {
    return res.status(400).json({ error: "Invalid session id." });
  }

  const session = await workoutSessionModel.getWorkoutSession(session_id);
  if (!session) {
    return res.status(404).json({ error: "Cannot find workout session." });
  }

  const result = SessionExerciseInput.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: "Invalid exercise data." });
  }

  const template = await exerciseTemplateModel.getExerciseTemplate(
    result.data.exercise_template_id,
  );

  if (!template) {
    return res.status(404).json({ error: "Cannot find template." });
  }

  // Prevents a client from using a template that belongs to another client.
  if (!template.client_id.equals(session.client_id)) {
    return res
      .status(400)
      .json({ error: "Template does not belong to this client." });
  }

  const exercise = {
    session_id,
    exercise_template_id: result.data.exercise_template_id,
    sets: result.data.sets,
    reps: result.data.reps,
    weight_in_kg: result.data.weight_in_kg,
  };

  const exerciseResultId =
    await sessionExerciseModel.addSessionExercise(exercise);

  res.status(201).json({ _id: exerciseResultId, ...exercise });
};

const SessionExerciseChangeInput = z.object({
  sets: z.int().positive(),
  reps: z.int().positive(),
  weight_in_kg: z.int().nonnegative().default(0),
});

export const updateSessionExercise = async (req: Request, res: Response) => {
  const session_id = parseObjectId(req.params.sessionId);
  if (!session_id) {
    return res.status(400).json({ error: "Invalid session id." });
  }

  const session = await workoutSessionModel.getWorkoutSession(session_id);
  if (!session) {
    return res.status(404).json({ error: "Cannot find workout session." });
  }

  const exercise_id = parseObjectId(req.params.exerciseId);
  if (!exercise_id) {
    return res.status(400).json({ error: "Invalid exercise id." });
  }

  const exercise =
    await sessionExerciseModel.getSessionExerciseById(exercise_id);
  if (!exercise) {
    return res.status(404).json({ error: "Cannot find exercise." });
  }

  const result = SessionExerciseChangeInput.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: "Invalid exercise data." });
  }

  const newExercise = {
    sets: result.data.sets,
    reps: result.data.reps,
    weight_in_kg: result.data.weight_in_kg,
  };

  await sessionExerciseModel.updateExerciseById(exercise_id, newExercise);
  res.status(200).json(newExercise);
};

export const deleteSessionExercise = async (req: Request, res: Response) => {
  const session_id = parseObjectId(req.params.sessionId);
  if (!session_id) {
    return res.status(400).json({ error: "Invalid session id." });
  }

  const session = await workoutSessionModel.getWorkoutSession(session_id);
  if (!session) {
    return res.status(404).json({ error: "Cannot find workout session." });
  }

  const exercise_id = parseObjectId(req.params.exerciseId);
  if (!exercise_id) {
    return res.status(400).json({ error: "Invalid exercise id." });
  }

  const exercise =
    await sessionExerciseModel.getSessionExerciseById(exercise_id);
  if (!exercise) {
    return res.status(404).json({ error: "Cannot find exercise." });
  }

  await sessionExerciseModel.deleteExerciseById(exercise_id);
  res.status(204).send();
};
