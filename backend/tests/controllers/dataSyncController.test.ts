import { ObjectId } from "mongodb";
import { createMockReq } from "../utils/createMockReq";
import { createMockRes } from "../utils/createMockRes";
import { createMockSession } from "../utils/createMockSession";
import { close, connect, getDb } from "../../config/database";
import type { SessionUser } from "../../types";
import {
  getMyClients,
  syncClientData,
  getLinkedClientSessions,
  getLinkedClientProgress,
} from "../../controllers/dataSyncController";

let trainerId: ObjectId;
let clientId: ObjectId;
let unlinkedClientId: ObjectId;
let benchTemplateId: ObjectId;
let squatTemplateId: ObjectId;
let oldSessionId: ObjectId;
let newSessionId: ObjectId;

const OLD_DATE = new Date("2026-01-05T10:00:00.000Z");
const NEW_DATE = new Date("2026-02-10T10:00:00.000Z");

const trainerSessionUser = (): SessionUser => ({
  id: trainerId.toString(),
  name: "test trainer",
  email: "trainer-sync-test@gmail.com",
  role: "trainer",
});

const trainerReq = (params: Record<string, string> = {}) =>
  createMockReq({
    params,
    session: createMockSession({ user: trainerSessionUser() }),
  });

// Seeds: a trainer, a linked client with two sessions (bench in both,
// squat in the newest), and an unlinked client.
const seed = async () => {
  const db = getDb();

  trainerId = (
    await db.collection("users").insertOne({
      name: "test trainer",
      email: "trainer-sync-test@gmail.com",
      password_hash: "hash",
      role: "trainer",
    })
  ).insertedId;

  clientId = (
    await db.collection("users").insertOne({
      name: "test client",
      email: "client-sync-test@gmail.com",
      password_hash: "hash",
      role: "client",
    })
  ).insertedId;

  unlinkedClientId = (
    await db.collection("users").insertOne({
      name: "unlinked client",
      email: "unlinked-sync-test@gmail.com",
      password_hash: "hash",
      role: "client",
    })
  ).insertedId;

  await db
    .collection("clients")
    .insertOne({ _id: clientId, trainer_id: trainerId });
  await db.collection("clients").insertOne({ _id: unlinkedClientId });

  benchTemplateId = (
    await db
      .collection("exercise_templates")
      .insertOne({ client_id: clientId, name: "Bench Press" })
  ).insertedId;

  squatTemplateId = (
    await db
      .collection("exercise_templates")
      .insertOne({ client_id: clientId, name: "Squat" })
  ).insertedId;

  oldSessionId = (
    await db
      .collection("sessions")
      .insertOne({ client_id: clientId, session_date: OLD_DATE })
  ).insertedId;

  newSessionId = (
    await db
      .collection("sessions")
      .insertOne({ client_id: clientId, session_date: NEW_DATE })
  ).insertedId;

  await db.collection("session_exercises").insertMany([
    {
      session_id: oldSessionId,
      exercise_template_id: benchTemplateId,
      sets: 3,
      reps: 10,
      weight_in_kg: 40,
    },
    {
      session_id: newSessionId,
      exercise_template_id: benchTemplateId,
      sets: 3,
      reps: 10,
      weight_in_kg: 50,
    },
    {
      session_id: newSessionId,
      exercise_template_id: squatTemplateId,
      sets: 5,
      reps: 5,
      weight_in_kg: 80,
    },
  ]);
};

const cleanup = async () => {
  const db = getDb();
  await db
    .collection("session_exercises")
    .deleteMany({ session_id: { $in: [oldSessionId, newSessionId] } });
  await db.collection("sessions").deleteMany({ client_id: clientId });
  await db
    .collection("exercise_templates")
    .deleteMany({ client_id: clientId });
  await db
    .collection("clients")
    .deleteMany({ _id: { $in: [clientId, unlinkedClientId] } });
  await db
    .collection("users")
    .deleteMany({ _id: { $in: [trainerId, clientId, unlinkedClientId] } });
};

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await close();
});

beforeEach(async () => {
  await seed();
});

afterEach(async () => {
  await cleanup();
});

describe("getMyClients", () => {
  it("returns 200 and an empty array for a trainer with no linked clients", async () => {
    await getDb()
      .collection("clients")
      .updateOne({ _id: clientId }, { $unset: { trainer_id: "" } });

    const { res, jsonMock, statusMock } = createMockRes();
    await getMyClients(trainerReq(), res);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith([]);
  });

  it("returns 200 and linked clients with a session summary", async () => {
    const { res, jsonMock, statusMock } = createMockRes();
    await getMyClients(trainerReq(), res);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith([
      {
        client_id: clientId.toString(),
        name: "test client",
        email: "client-sync-test@gmail.com",
        total_sessions: 2,
        last_session_date: NEW_DATE.toISOString(),
      },
    ]);
  });
});

describe("syncClientData", () => {
  it("returns 400 for an invalid client id", async () => {
    const { res, jsonMock, statusMock } = createMockRes();
    await syncClientData(trainerReq({ clientId: "not-an-id" }), res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid client id." });
  });

  it("returns 404 for a client not linked to the trainer", async () => {
    const { res, jsonMock, statusMock } = createMockRes();
    await syncClientData(
      trainerReq({ clientId: unlinkedClientId.toString() }),
      res,
    );

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Client not linked to this trainer.",
    });
  });

  it("returns 200 and the full sync payload for a linked client", async () => {
    const { res, jsonMock, statusMock } = createMockRes();
    await syncClientData(trainerReq({ clientId: clientId.toString() }), res);

    expect(statusMock).toHaveBeenCalledWith(200);

    const payload = jsonMock.mock.calls[0][0];

    expect(payload.client).toEqual({
      client_id: clientId.toString(),
      name: "test client",
      email: "client-sync-test@gmail.com",
    });
    expect(payload.total_sessions).toBe(2);
    expect(payload.sessions).toHaveLength(2);
    expect(payload.progress).toHaveLength(2);
    expect(typeof payload.synced_at).toBe("string");
  });
});

describe("getLinkedClientSessions", () => {
  it("returns 200 and the session history newest first with exercises", async () => {
    const { res, jsonMock, statusMock } = createMockRes();
    await getLinkedClientSessions(
      trainerReq({ clientId: clientId.toString() }),
      res,
    );

    expect(statusMock).toHaveBeenCalledWith(200);

    const sessions = jsonMock.mock.calls[0][0];

    expect(sessions).toHaveLength(2);
    expect(sessions[0].session_id).toBe(newSessionId.toString());
    expect(sessions[0].session_date).toBe(NEW_DATE.toISOString());
    expect(sessions[1].session_id).toBe(oldSessionId.toString());

    const newExerciseNames = sessions[0].exercises
      .map((e: { name: string }) => e.name)
      .sort();
    expect(newExerciseNames).toEqual(["Bench Press", "Squat"]);
    expect(sessions[1].exercises).toEqual([
      {
        exercise_id: expect.any(String),
        exercise_template_id: benchTemplateId.toString(),
        name: "Bench Press",
        sets: 3,
        reps: 10,
        weight_in_kg: 40,
      },
    ]);
  });

  it("returns 404 for a client not linked to the trainer", async () => {
    const { res, jsonMock, statusMock } = createMockRes();
    await getLinkedClientSessions(
      trainerReq({ clientId: unlinkedClientId.toString() }),
      res,
    );

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Client not linked to this trainer.",
    });
  });
});

describe("getLinkedClientProgress", () => {
  it("returns 200 and per-exercise progress stats", async () => {
    const { res, jsonMock, statusMock } = createMockRes();
    await getLinkedClientProgress(
      trainerReq({ clientId: clientId.toString() }),
      res,
    );

    expect(statusMock).toHaveBeenCalledWith(200);

    const progress = jsonMock.mock.calls[0][0];

    // Sorted by template name: Bench Press, Squat.
    expect(progress).toEqual([
      {
        exercise_template_id: benchTemplateId.toString(),
        name: "Bench Press",
        times_performed: 2,
        max_weight_in_kg: 50,
        first_weight_in_kg: 40,
        latest_weight_in_kg: 50,
        weight_change_in_kg: 10,
        // 3*10*40 + 3*10*50
        total_volume_in_kg: 2700,
        first_performed: OLD_DATE.toISOString(),
        last_performed: NEW_DATE.toISOString(),
      },
      {
        exercise_template_id: squatTemplateId.toString(),
        name: "Squat",
        times_performed: 1,
        max_weight_in_kg: 80,
        first_weight_in_kg: 80,
        latest_weight_in_kg: 80,
        weight_change_in_kg: 0,
        // 5*5*80
        total_volume_in_kg: 2000,
        first_performed: NEW_DATE.toISOString(),
        last_performed: NEW_DATE.toISOString(),
      },
    ]);
  });

  it("returns 400 for an invalid client id", async () => {
    const { res, jsonMock, statusMock } = createMockRes();
    await getLinkedClientProgress(trainerReq({ clientId: "bad" }), res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid client id." });
  });
});
