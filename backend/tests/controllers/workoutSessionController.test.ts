import { createMockReq } from "../utils/createMockReq";
import { createMockRes } from "../utils/createMockRes";
import { close, connect, getDb } from "../../config/database";
import * as userModel from "../../models/User";
import { ObjectId } from "mongodb";
import { insertTestUser } from "../utils/insertTestUser";
import {
  addWorkoutSession,
  deleteSessionById,
  getClientSessions,
  WorkoutSession,
} from "../../models/WorkoutSession";
import {
  addSessionExercise,
  getSessionExercises,
  SessionExercise,
} from "../../models/SessionExercise";
import {
  addExerciseTemplate,
  ExerciseTemplate,
  getAllExerciseTemplatesForClient,
} from "../../models/ExerciseTemplate";
import { getClientWorkoutSessions } from "../../controllers/workoutSessionController";

// Returns a random integer in the interval [0, max).
// Function from
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

describe("getClientWorkoutSessions", () => {
  let testClientId: ObjectId;

  beforeAll(async () => {
    await connect();
    await userModel.init();
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    testClientId = await insertTestUser();

    await getDb().collection("clients").insertOne({ _id: testClientId });
  });

  afterEach(async () => {
    const sessions = await getClientSessions(testClientId);

    // Prefer not to write another transaction here for deleting sessions,
    // just using the function we already made.
    for (const s of sessions) {
      await deleteSessionById(s._id as ObjectId);
    }

    await getDb()
      .collection("exercise_templates")
      .deleteMany({ client_id: testClientId });
    await getDb().collection("clients").deleteOne({ _id: testClientId });
    await getDb().collection("users").deleteOne({ _id: testClientId });
  });

  it("returns 200 and a client's workout sessions", async () => {
    const sampleExerciseTemplates: ExerciseTemplate[] = [
      { client_id: testClientId, name: "pushups" },
      { client_id: testClientId, name: "situps" },
      { client_id: testClientId, name: "planks" },
      { client_id: testClientId, name: "Barbell curl" },
    ];

    for (const et of sampleExerciseTemplates) {
      et._id = await addExerciseTemplate(et);
    }

    expect(await getAllExerciseTemplatesForClient(testClientId)).toEqual(
      sampleExerciseTemplates,
    );

    const sampleSessions: WorkoutSession[] = [
      {
        client_id: testClientId,
        session_date: new Date(),
      },
      {
        client_id: testClientId,
        session_date: new Date("2026-06-24"),
      },
      {
        client_id: testClientId,
        session_date: new Date("2018-12-10T14:48:00"),
      },
    ];

    for (const s of sampleSessions) {
      s._id = await addWorkoutSession(s);
    }

    expect(await getClientSessions(testClientId)).toEqual(sampleSessions);

    const sampleExercises: SessionExercise[] = [
      {
        session_id: (
          sampleSessions[getRandomInt(sampleSessions.length)] as WorkoutSession
        )._id as ObjectId,
        exercise_template_id: (
          sampleExerciseTemplates[
            getRandomInt(sampleExerciseTemplates.length)
          ] as ExerciseTemplate
        )._id as ObjectId,
        sets: 5,
        reps: 12,
        weight_in_kg: 23,
      },
      {
        session_id: (
          sampleSessions[getRandomInt(sampleSessions.length)] as WorkoutSession
        )._id as ObjectId,
        exercise_template_id: (
          sampleExerciseTemplates[
            getRandomInt(sampleExerciseTemplates.length)
          ] as ExerciseTemplate
        )._id as ObjectId,
        sets: 4,
        reps: 12,
        weight_in_kg: 42,
      },
    ];

    for (const e of sampleExercises) {
      e._id = await addSessionExercise(e);
    }

    for (const s of sampleSessions) {
      const sExercises = await getSessionExercises(s._id as ObjectId);
      expect(sExercises).toEqual(
        sampleExercises.filter((e) => e.session_id === (s._id as ObjectId)),
      );
    }

    const req = createMockReq({
      params: { clientId: testClientId.toString() },
    });

    const { res, jsonMock, statusMock } = createMockRes();

    await getClientWorkoutSessions(req, res);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(sampleSessions);
  });
});

describe("addClientWorkoutSession", () => {});

describe("getWorkoutSessionById", () => {});

describe("updateWorkoutSession", () => {});

describe("deleteWorkoutSession", () => {});

describe("getWorkoutSessionExercises", () => {});

describe("addSessionExercise", () => {});

describe("updateSessionExercise", () => {});

describe("deleteSessionExercise", () => {});
