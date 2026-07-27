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
  getSessionExercisesAndTemplateNames,
  SessionExercise,
} from "../../models/SessionExercise";
import {
  addExerciseTemplate,
  ExerciseTemplate,
  getAllExerciseTemplatesForClient,
} from "../../models/ExerciseTemplate";
import {
  addClientWorkoutSession,
  deleteWorkoutSession,
  getClientWorkoutSessions,
  getWorkoutSessionById,
  getWorkoutSessionExercises,
  updateWorkoutSession,
} from "../../controllers/workoutSessionController";
import * as workoutSessionController from "../../controllers/workoutSessionController";

// Returns a random integer in the interval [0, max).
// Function from
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

let testClientId: ObjectId;

describe("getClientWorkoutSessions", () => {
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

    await getDb().collection("clients").deleteOne({ _id: testClientId });
    await getDb().collection("users").deleteOne({ _id: testClientId });
  });

  it("returns 200 and a client's workout sessions", async () => {
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

    const req = createMockReq({
      params: { clientId: testClientId.toString() },
    });

    const { res, jsonMock, statusMock } = createMockRes();

    await getClientWorkoutSessions(req, res);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(sampleSessions);
  });
});

describe("addClientWorkoutSession", () => {
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

    for (const s of sessions) {
      await deleteSessionById(s._id as ObjectId);
    }

    await getDb().collection("clients").deleteOne({ _id: testClientId });
    await getDb().collection("users").deleteOne({ _id: testClientId });
  });

  it("returns 400 for invalid session data", async () => {
    const sampleSession = {
      client_id: testClientId,
    };

    const req = createMockReq({
      params: { clientId: testClientId.toString() },
      body: sampleSession,
    });

    const { res, jsonMock, statusMock } = createMockRes();

    await addClientWorkoutSession(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);

    const expectedError = { error: "Invalid date." };

    expect(jsonMock).toHaveBeenCalledWith(expectedError);

    const sampleSession2 = {
      client_id: testClientId,
      session_date: new Date("abc"),
    };

    const req2 = createMockReq({
      params: { clientId: testClientId.toString() },
      body: sampleSession2,
    });

    const {
      res: res2,
      jsonMock: jsonMock2,
      statusMock: statusMock2,
    } = createMockRes();

    await addClientWorkoutSession(req2, res2);

    expect(statusMock2).toHaveBeenCalledWith(400);
    expect(jsonMock2).toHaveBeenCalledWith(expectedError);
  });

  it("returns 201 and creates the new session", async () => {
    const sampleSession = {
      client_id: testClientId,
      session_date: new Date(),
    };

    const req = createMockReq({
      params: { clientId: testClientId.toString() },
      body: sampleSession,
    });

    const { res, jsonMock, statusMock } = createMockRes();

    await addClientWorkoutSession(req, res);

    expect(await getClientSessions(testClientId)).toEqual([
      { _id: expect.any(ObjectId), ...sampleSession },
    ]);

    expect(statusMock).toHaveBeenCalledWith(201);

    expect(jsonMock).toHaveBeenCalledWith({
      _id: expect.any(ObjectId),
      ...sampleSession,
    });

    const sampleSession2 = {
      client_id: testClientId,
      session_date: new Date("2026-10-10T14:48:00"),
    };

    const req2 = createMockReq({
      params: { clientId: testClientId.toString() },
      body: sampleSession2,
    });

    const {
      res: res2,
      jsonMock: jsonMock2,
      statusMock: statusMock2,
    } = createMockRes();

    await addClientWorkoutSession(req2, res2);

    expect(statusMock2).toHaveBeenCalledWith(201);
    expect(jsonMock2).toHaveBeenCalledWith({
      _id: expect.any(ObjectId),
      ...sampleSession2,
    });
  });
});

describe("getWorkoutSessionById", () => {
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

    for (const s of sessions) {
      await deleteSessionById(s._id as ObjectId);
    }

    await getDb().collection("clients").deleteOne({ _id: testClientId });
    await getDb().collection("users").deleteOne({ _id: testClientId });
  });

  it("returns 200 and the session", async () => {
    const sampleSession: WorkoutSession = {
      client_id: testClientId,
      session_date: new Date(),
    };

    sampleSession._id = await addWorkoutSession(sampleSession);

    const req = createMockReq({
      params: { sessionId: sampleSession._id.toString() },
      body: sampleSession,
    });

    const { res, jsonMock, statusMock } = createMockRes();

    await getWorkoutSessionById(req, res);

    expect(statusMock).toHaveBeenCalledWith(200);

    expect(jsonMock).toHaveBeenCalledWith(sampleSession);
  });
});

describe("updateWorkoutSession", () => {
  let sampleSession: WorkoutSession;

  beforeAll(async () => {
    await connect();
    await userModel.init();
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    testClientId = await insertTestUser();
    sampleSession = {
      client_id: testClientId,
      session_date: new Date(),
    };

    await getDb().collection("clients").insertOne({ _id: testClientId });
  });

  afterEach(async () => {
    const sessions = await getClientSessions(testClientId);

    for (const s of sessions) {
      await deleteSessionById(s._id as ObjectId);
    }

    await getDb().collection("clients").deleteOne({ _id: testClientId });
    await getDb().collection("users").deleteOne({ _id: testClientId });
  });

  it("returns 400 for invalid session data", async () => {
    sampleSession._id = await addWorkoutSession(sampleSession);
    expect(await getClientSessions(testClientId)).toEqual([sampleSession]);

    const newSession = {
      client_id: testClientId,
    };

    const req = createMockReq({
      params: { sessionId: sampleSession._id.toString() },
      body: newSession,
    });

    const { res, jsonMock, statusMock } = createMockRes();

    await updateWorkoutSession(req, res);

    // Check to make sure that the session has not actually been updated.
    expect(await getClientSessions(testClientId)).toEqual([sampleSession]);

    const expectedError = { error: "Invalid date." };

    expect(statusMock).toHaveBeenCalledWith(400);

    expect(jsonMock).toHaveBeenCalledWith(expectedError);

    const newSession2: WorkoutSession = {
      client_id: testClientId,
      session_date: new Date("abc"),
    };

    const req2 = createMockReq({
      params: { sessionId: sampleSession._id.toString() },
      body: newSession2,
    });

    const {
      res: res2,
      jsonMock: jsonMock2,
      statusMock: statusMock2,
    } = createMockRes();

    await updateWorkoutSession(req2, res2);

    expect(await getClientSessions(testClientId)).toEqual([sampleSession]);

    expect(statusMock2).toHaveBeenCalledWith(400);

    expect(jsonMock2).toHaveBeenCalledWith(expectedError);
  });

  it("returns 200 and updates the session", async () => {
    sampleSession._id = await addWorkoutSession(sampleSession);
    expect(await getClientSessions(testClientId)).toEqual([sampleSession]);

    const newSession: WorkoutSession = {
      client_id: testClientId,
      session_date: new Date("2015-10-10T14:48:00"),
    };

    const req = createMockReq({
      params: { sessionId: sampleSession._id.toString() },
      body: newSession,
    });

    const { res, jsonMock, statusMock } = createMockRes();

    await updateWorkoutSession(req, res);

    expect(await getClientSessions(testClientId)).toEqual([
      {
        _id: expect.any(ObjectId),
        ...newSession,
      },
    ]);

    expect(statusMock).toHaveBeenCalledWith(200);

    expect(jsonMock).toHaveBeenCalledWith({
      _id: expect.any(ObjectId),
      ...newSession,
    });
  });
});

describe("deleteWorkoutSession", () => {
  let sampleSession: WorkoutSession;

  beforeAll(async () => {
    await connect();
    await userModel.init();
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    testClientId = await insertTestUser();
    sampleSession = {
      client_id: testClientId,
      session_date: new Date(),
    };

    await getDb().collection("clients").insertOne({ _id: testClientId });
  });

  afterEach(async () => {
    const sessions = await getClientSessions(testClientId);

    for (const s of sessions) {
      await deleteSessionById(s._id as ObjectId);
    }

    await getDb().collection("clients").deleteOne({ _id: testClientId });
    await getDb().collection("users").deleteOne({ _id: testClientId });
  });

  it("returns 204 and deletes the session and 404 if trying to delete it again", async () => {
    sampleSession._id = await addWorkoutSession(sampleSession);
    const req = createMockReq({
      params: { sessionId: sampleSession._id.toString() },
    });

    const { res, statusMock } = createMockRes();

    await deleteWorkoutSession(req, res);

    expect(statusMock).toHaveBeenCalledWith(204);

    expect(await getClientSessions(testClientId)).toEqual([]);

    const { res: res2, statusMock: statusMock2, jsonMock } = createMockRes();

    await deleteWorkoutSession(req, res2);

    expect(statusMock2).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Cannot find session." });

    expect(await getClientSessions(testClientId)).toEqual([]);
  });
});

describe("getWorkoutSessionExercises", () => {
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

    for (const s of sessions) {
      await deleteSessionById(s._id as ObjectId);
    }

    await getDb()
      .collection("exercise_templates")
      .deleteMany({ client_id: testClientId });
    await getDb().collection("clients").deleteOne({ _id: testClientId });
    await getDb().collection("users").deleteOne({ _id: testClientId });
  });

  it("returns 200 and a session's exercises", async () => {
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

    const sampleSession: WorkoutSession = {
      client_id: testClientId,
      session_date: new Date(),
    };
    sampleSession._id = await addWorkoutSession(sampleSession);

    const sampleExercises: SessionExercise[] = [
      {
        session_id: sampleSession._id,
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
        session_id: sampleSession._id,
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

    const expectedExercises = await getSessionExercisesAndTemplateNames(
      sampleSession._id,
    );

    const req = createMockReq({
      params: { sessionId: sampleSession._id.toString() },
    });

    const { res, jsonMock, statusMock } = createMockRes();

    await getWorkoutSessionExercises(req, res);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(expectedExercises);
  });
});

describe("addSessionExercise", () => {
  let sampleSession: WorkoutSession;
  let sampleExerciseTemplates: ExerciseTemplate[];

  beforeAll(async () => {
    await connect();
    await userModel.init();
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    testClientId = await insertTestUser();
    sampleSession = {
      client_id: testClientId,
      session_date: new Date(),
    };
    sampleSession._id = await addWorkoutSession(sampleSession);

    sampleExerciseTemplates = [
      { client_id: testClientId, name: "pushups" },
      { client_id: testClientId, name: "situps" },
      { client_id: testClientId, name: "planks" },
      { client_id: testClientId, name: "Barbell curl" },
    ];

    for (const et of sampleExerciseTemplates) {
      et._id = await addExerciseTemplate(et);
    }

    await getDb().collection("clients").insertOne({ _id: testClientId });
  });

  afterEach(async () => {
    const sessions = await getClientSessions(testClientId);

    for (const s of sessions) {
      await deleteSessionById(s._id as ObjectId);
    }

    await getDb()
      .collection("exercise_templates")
      .deleteMany({ client_id: testClientId });
    await getDb().collection("clients").deleteOne({ _id: testClientId });
    await getDb().collection("users").deleteOne({ _id: testClientId });
  });

  it("returns 400 on bad exercise data", async () => {
    const sampleExercise = {
      session_id: sampleSession._id,
      sets: 5,
      weight_in_kg: 15,
    };

    const req = createMockReq({
      params: { sessionId: sampleSession._id!.toString() },
      body: sampleExercise,
    });

    const { res, statusMock, jsonMock } = createMockRes();

    const expectedError = { error: "Invalid exercise data." };

    await workoutSessionController.addSessionExercise(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(expectedError);

    expect(await getAllExerciseTemplatesForClient(testClientId)).toEqual(
      sampleExerciseTemplates,
    );

    const sampleExercise2 = {
      session_id: sampleSession._id,
      exercise_template_id: (
        sampleExerciseTemplates[getRandomInt(sampleExerciseTemplates.length)]
          ?._id as ObjectId
      ).toString(),
      sets: 5,
      reps: 2,
      weight_in_kg: -2.4,
    };

    const req2 = createMockReq({
      params: { sessionId: sampleSession._id!.toString() },
      body: sampleExercise2,
    });

    const {
      res: res2,
      statusMock: statusMock2,
      jsonMock: jsonMock2,
    } = createMockRes();

    await workoutSessionController.addSessionExercise(req2, res2);

    expect(statusMock2).toHaveBeenCalledWith(400);
    expect(jsonMock2).toHaveBeenCalledWith(expectedError);
  });

  it("returns 400 if trying to use a template that belongs to another client", async () => {
    const testClient2Id = (
      await getDb().collection("users").insertOne({
        name: "test2",
        password_hash: "test2passwordhash",
        email: "test2@gmail.com",
        role: "client",
      })
    ).insertedId;
    await getDb().collection("clients").insertOne({ _id: testClient2Id });

    const sampleSession2: WorkoutSession = {
      client_id: testClient2Id,
      session_date: new Date(),
    };

    sampleSession2._id = await addWorkoutSession(sampleSession2);

    const sampleExercise = {
      session_id: sampleSession2._id,
      exercise_template_id: (
        sampleExerciseTemplates[getRandomInt(sampleExerciseTemplates.length)]
          ?._id as ObjectId
      ).toString(),
      sets: 5,
      reps: 2,
    };

    const req = createMockReq({
      params: { sessionId: sampleSession2._id!.toString() },
      body: sampleExercise,
    });

    const { res, statusMock, jsonMock } = createMockRes();

    await workoutSessionController.addSessionExercise(req, res);

    await deleteSessionById(sampleSession2._id);
    await getDb().collection("clients").deleteOne({ _id: testClient2Id });
    await getDb().collection("users").deleteOne({ _id: testClient2Id });

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Template does not belong to this client.",
    });
  });

  it("returns 201 and creates a new exercise", async () => {
    const exercise_template_id =
      sampleExerciseTemplates[getRandomInt(sampleExerciseTemplates.length)]!
        ._id;

    const sampleExercise = {
      session_id: sampleSession._id,
      sets: 5,
      reps: 2,
    };

    const req = createMockReq({
      params: { sessionId: sampleSession._id!.toString() },
      body: {
        ...sampleExercise,
        exercise_template_id: exercise_template_id?.toString(),
      },
    });

    const { res, statusMock, jsonMock } = createMockRes();

    await workoutSessionController.addSessionExercise(req, res);

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      _id: expect.any(ObjectId),
      exercise_template_id,
      ...sampleExercise,
      weight_in_kg: expect.anything(),
    });

    expect(await getSessionExercises(sampleSession._id as ObjectId)).toEqual([
      {
        _id: expect.any(ObjectId),
        exercise_template_id,
        ...sampleExercise,
        weight_in_kg: expect.anything(),
      },
    ]);
  });
});

describe("updateSessionExercise", () => {
  let sampleSession: WorkoutSession;
  let sampleExerciseTemplates: ExerciseTemplate[];

  beforeAll(async () => {
    await connect();
    await userModel.init();
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    testClientId = await insertTestUser();
    sampleSession = {
      client_id: testClientId,
      session_date: new Date(),
    };
    sampleSession._id = await addWorkoutSession(sampleSession);

    sampleExerciseTemplates = [
      { client_id: testClientId, name: "pushups" },
      { client_id: testClientId, name: "situps" },
      { client_id: testClientId, name: "planks" },
      { client_id: testClientId, name: "Barbell curl" },
    ];

    for (const et of sampleExerciseTemplates) {
      et._id = await addExerciseTemplate(et);
    }

    await getDb().collection("clients").insertOne({ _id: testClientId });
  });

  afterEach(async () => {
    const sessions = await getClientSessions(testClientId);

    for (const s of sessions) {
      await deleteSessionById(s._id as ObjectId);
    }

    await getDb()
      .collection("exercise_templates")
      .deleteMany({ client_id: testClientId });
    await getDb().collection("clients").deleteOne({ _id: testClientId });
    await getDb().collection("users").deleteOne({ _id: testClientId });
  });

  it("returns 400 on bad exercise data", async () => {
    const sampleExercise: SessionExercise = {
      session_id: sampleSession._id!,
      exercise_template_id:
        sampleExerciseTemplates[getRandomInt(sampleExerciseTemplates.length)]!
          ._id!,
      sets: 3,
      reps: 12,
      weight_in_kg: 30,
    };

    sampleExercise._id = await addSessionExercise(sampleExercise);

    expect(await getSessionExercises(sampleSession._id!)).toEqual([
      sampleExercise,
    ]);

    const newExerciseInput = {
      sets: 5,
      reps: 12,
      weight_in_kg: 3.001,
    };

    const req = createMockReq({
      params: {
        sessionId: sampleSession._id!.toString(),
        exerciseId: sampleExercise._id.toString(),
      },
      body: newExerciseInput,
    });

    const { res, statusMock, jsonMock } = createMockRes();

    await workoutSessionController.updateSessionExercise(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid exercise data." });

    expect(await getSessionExercises(sampleSession._id!)).toEqual([
      sampleExercise,
    ]);
  });

  it("returns 200 and updates the exercise", async () => {
    const sampleExercise: SessionExercise = {
      session_id: sampleSession._id!,
      exercise_template_id:
        sampleExerciseTemplates[getRandomInt(sampleExerciseTemplates.length)]!
          ._id!,
      sets: 3,
      reps: 12,
      weight_in_kg: 30,
    };

    sampleExercise._id = await addSessionExercise(sampleExercise);

    expect(await getSessionExercises(sampleSession._id!)).toEqual([
      sampleExercise,
    ]);

    const newExerciseInput = {
      sets: 5,
      reps: 5,
      weight_in_kg: 15,
    };

    const req = createMockReq({
      params: {
        sessionId: sampleSession._id!.toString(),
        exerciseId: sampleExercise._id.toString(),
      },
      body: newExerciseInput,
    });

    const { res, statusMock, jsonMock } = createMockRes();

    await workoutSessionController.updateSessionExercise(req, res);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(newExerciseInput);

    expect(await getSessionExercises(sampleSession._id!)).toEqual([
      { ...sampleExercise, ...newExerciseInput },
    ]);
  });
});

describe("deleteSessionExercise", () => {
  let sampleSession: WorkoutSession;
  let sampleExerciseTemplates: ExerciseTemplate[];

  beforeAll(async () => {
    await connect();
    await userModel.init();
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    testClientId = await insertTestUser();
    sampleSession = {
      client_id: testClientId,
      session_date: new Date(),
    };
    sampleSession._id = await addWorkoutSession(sampleSession);

    sampleExerciseTemplates = [
      { client_id: testClientId, name: "pushups" },
      { client_id: testClientId, name: "situps" },
      { client_id: testClientId, name: "planks" },
      { client_id: testClientId, name: "Barbell curl" },
    ];

    for (const et of sampleExerciseTemplates) {
      et._id = await addExerciseTemplate(et);
    }

    await getDb().collection("clients").insertOne({ _id: testClientId });
  });

  afterEach(async () => {
    const sessions = await getClientSessions(testClientId);

    for (const s of sessions) {
      await deleteSessionById(s._id as ObjectId);
    }

    await getDb()
      .collection("exercise_templates")
      .deleteMany({ client_id: testClientId });
    await getDb().collection("clients").deleteOne({ _id: testClientId });
    await getDb().collection("users").deleteOne({ _id: testClientId });
  });

  it("returns 204 and deletes the exercise and 404 when trying to delete it again", async () => {
    const sampleExercise: SessionExercise = {
      session_id: sampleSession._id!,
      exercise_template_id:
        sampleExerciseTemplates[getRandomInt(sampleExerciseTemplates.length)]!
          ._id!,
      sets: 3,
      reps: 12,
      weight_in_kg: 30,
    };

    const sampleExercise2: SessionExercise = {
      session_id: sampleSession._id!,
      exercise_template_id:
        sampleExerciseTemplates[getRandomInt(sampleExerciseTemplates.length)]!
          ._id!,
      sets: 643,
      reps: 321,
      weight_in_kg: 0,
    };

    sampleExercise._id = await addSessionExercise(sampleExercise);
    sampleExercise2._id = await addSessionExercise(sampleExercise2);

    expect(await getSessionExercises(sampleSession._id!)).toEqual([
      sampleExercise,
      sampleExercise2,
    ]);

    const req = createMockReq({
      params: {
        sessionId: sampleSession._id!.toString(),
        exerciseId: sampleExercise._id.toString(),
      },
    });

    const { res, statusMock } = createMockRes();

    await workoutSessionController.deleteSessionExercise(req, res);

    expect(statusMock).toHaveBeenCalledWith(204);

    expect(await getSessionExercises(sampleSession._id!)).toEqual([
      sampleExercise2,
    ]);

    const { res: res2, jsonMock, statusMock: statusMock2 } = createMockRes();

    await workoutSessionController.deleteSessionExercise(req, res2);

    expect(statusMock2).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Cannot find exercise." });
  });
});
