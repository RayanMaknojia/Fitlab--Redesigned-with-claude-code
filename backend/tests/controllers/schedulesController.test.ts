import { ObjectId } from "mongodb";
import { createMockReq } from "../utils/createMockReq";
import { createMockRes } from "../utils/createMockRes";
import { createMockSession } from "../utils/createMockSession";
import { close, connect, getDb } from "../../config/database";
import type { SessionUser } from "../../types";
import {
  addClientSchedule,
  deleteClientSchedule,
  getClientSchedules,
  getMySchedules,
  getTrainerSchedules,
  requestReschedule,
  respondToReschedule,
} from "../../controllers/schedulesController";

let trainerId: ObjectId;
let clientId: ObjectId;
let otherClientId: ObjectId;

const START = new Date("2026-08-03T10:00:00.000Z");
const PROPOSED = new Date("2026-08-05T15:00:00.000Z");

const trainerUser = (): SessionUser => ({
  id: trainerId.toString(),
  name: "test trainer",
  email: "trainer-schedule-test@gmail.com",
  role: "trainer",
});

const clientUser = (id: ObjectId = clientId): SessionUser => ({
  id: id.toString(),
  name: "test client",
  email: "client-schedule-test@gmail.com",
  role: "client",
});

const reqAs = (
  user: SessionUser,
  params: Record<string, string> = {},
  body: unknown = {},
) =>
  createMockReq({
    params,
    body,
    session: createMockSession({ user }),
  });

// Seeds a trainer, a linked client, and a second client linked to nobody.
const seed = async () => {
  const db = getDb();

  trainerId = (
    await db.collection("users").insertOne({
      name: "test trainer",
      email: "trainer-schedule-test@gmail.com",
      password_hash: "hash",
      role: "trainer",
    })
  ).insertedId;

  clientId = (
    await db.collection("users").insertOne({
      name: "test client",
      email: "client-schedule-test@gmail.com",
      password_hash: "hash",
      role: "client",
    })
  ).insertedId;

  otherClientId = (
    await db.collection("users").insertOne({
      name: "unlinked client",
      email: "unlinked-schedule-test@gmail.com",
      password_hash: "hash",
      role: "client",
    })
  ).insertedId;

  await db.collection("clients").insertMany([
    { _id: clientId, trainer_id: trainerId },
    { _id: otherClientId },
  ]);
};

const cleanup = async () => {
  const db = getDb();
  const userIds = [trainerId, clientId, otherClientId];

  await db.collection("users").deleteMany({ _id: { $in: userIds } });
  await db.collection("clients").deleteMany({ _id: { $in: userIds } });
  await db
    .collection("schedules")
    .deleteMany({ client_id: { $in: [clientId, otherClientId] } });
};

const insertSchedule = async (overrides: Record<string, unknown> = {}) => {
  return (
    await getDb()
      .collection("schedules")
      .insertOne({
        client_id: clientId,
        trainer_id: trainerId,
        start_time: START,
        duration_in_minutes: 60,
        ...overrides,
      })
  ).insertedId;
};

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await close();
});

beforeEach(seed);
afterEach(cleanup);

describe("getTrainerSchedules", () => {
  it("returns 200 and [] when linked clients have no schedules", async () => {
    const { res, statusMock, jsonMock } = createMockRes();

    await getTrainerSchedules(reqAs(trainerUser()), res);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith([]);
  });

  it("returns linked clients' schedules with client info, sorted by start time", async () => {
    const laterId = await insertSchedule({
      start_time: new Date("2026-08-10T10:00:00.000Z"),
    });
    const earlierId = await insertSchedule();
    // Schedules of clients not linked to this trainer must not appear.
    await insertSchedule({ client_id: otherClientId });

    const { res, statusMock, jsonMock } = createMockRes();

    await getTrainerSchedules(reqAs(trainerUser()), res);

    expect(statusMock).toHaveBeenCalledWith(200);
    const schedules = jsonMock.mock.calls[0][0];

    expect(schedules).toHaveLength(2);
    expect(schedules[0]).toMatchObject({
      schedule_id: earlierId.toString(),
      client_id: clientId.toString(),
      client_name: "test client",
      client_email: "client-schedule-test@gmail.com",
      start_time: START.toISOString(),
      duration_in_minutes: 60,
      reschedule_request: null,
    });
    expect(schedules[1].schedule_id).toBe(laterId.toString());
  });
});

describe("getMySchedules / getClientSchedules", () => {
  it("returns 200 and the logged-in client's schedules with trainer name", async () => {
    const scheduleId = await insertSchedule();

    const { res, statusMock, jsonMock } = createMockRes();

    await getMySchedules(reqAs(clientUser()), res);

    expect(statusMock).toHaveBeenCalledWith(200);
    const schedules = jsonMock.mock.calls[0][0];

    expect(schedules).toHaveLength(1);
    expect(schedules[0]).toMatchObject({
      schedule_id: scheduleId.toString(),
      trainer_id: trainerId.toString(),
      trainer_name: "test trainer",
      start_time: START.toISOString(),
      duration_in_minutes: 60,
    });
  });

  it("getClientSchedules returns the schedules for the :clientId in the path", async () => {
    await insertSchedule();

    const { res, statusMock, jsonMock } = createMockRes();

    await getClientSchedules(
      reqAs(trainerUser(), { clientId: clientId.toString() }),
      res,
    );

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock.mock.calls[0][0]).toHaveLength(1);
  });
});

describe("addClientSchedule", () => {
  it("trainer booking a linked client returns 201 with trainer_id set", async () => {
    const req = reqAs(
      trainerUser(),
      { clientId: clientId.toString() },
      { start_time: START.toISOString(), duration_in_minutes: 45 },
    );

    const { res, statusMock, jsonMock } = createMockRes();

    await addClientSchedule(req, res);

    expect(statusMock).toHaveBeenCalledWith(201);
    const schedule = jsonMock.mock.calls[0][0];
    expect(schedule.trainer_id).toEqual(trainerId);
    expect(schedule.duration_in_minutes).toBe(45);
  });

  it("trainer booking an unlinked client returns 404", async () => {
    const req = reqAs(
      trainerUser(),
      { clientId: otherClientId.toString() },
      { start_time: START.toISOString(), duration_in_minutes: 45 },
    );

    const { res, statusMock } = createMockRes();

    await addClientSchedule(req, res);

    expect(statusMock).toHaveBeenCalledWith(404);
  });

  it("client booking for themself returns 201 without trainer_id", async () => {
    const req = reqAs(
      clientUser(),
      { clientId: clientId.toString() },
      { start_time: START.toISOString(), duration_in_minutes: 30 },
    );

    const { res, statusMock, jsonMock } = createMockRes();

    await addClientSchedule(req, res);

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock.mock.calls[0][0].trainer_id).toBeUndefined();
  });

  it("returns 400 for invalid schedule data", async () => {
    const req = reqAs(
      trainerUser(),
      { clientId: clientId.toString() },
      { start_time: "not a date", duration_in_minutes: -5 },
    );

    const { res, statusMock } = createMockRes();

    await addClientSchedule(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
  });
});

describe("requestReschedule", () => {
  const body = {
    proposed_start_time: PROPOSED.toISOString(),
    proposed_duration_in_minutes: 90,
    message: "Something came up, can we move this?",
  };

  it("returns 201 and stores a pending request on the schedule", async () => {
    const scheduleId = await insertSchedule();

    const req = reqAs(
      trainerUser(),
      { scheduleId: scheduleId.toString() },
      body,
    );
    const { res, statusMock, jsonMock } = createMockRes();

    await requestReschedule(req, res);

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock.mock.calls[0][0]).toMatchObject({
      proposed_start_time: PROPOSED.toISOString(),
      proposed_duration_in_minutes: 90,
      message: "Something came up, can we move this?",
      status: "pending",
      responded_at: null,
    });

    const stored = await getDb()
      .collection("schedules")
      .findOne({ _id: scheduleId });
    expect(stored?.reschedule_request?.status).toBe("pending");
  });

  it("returns 404 for a nonexistent schedule", async () => {
    const req = reqAs(
      trainerUser(),
      { scheduleId: new ObjectId().toString() },
      body,
    );
    const { res, statusMock } = createMockRes();

    await requestReschedule(req, res);

    expect(statusMock).toHaveBeenCalledWith(404);
  });

  it("returns 403 when the schedule's client is not linked to the trainer", async () => {
    const scheduleId = await insertSchedule({ client_id: otherClientId });

    const req = reqAs(
      trainerUser(),
      { scheduleId: scheduleId.toString() },
      body,
    );
    const { res, statusMock } = createMockRes();

    await requestReschedule(req, res);

    expect(statusMock).toHaveBeenCalledWith(403);
  });

  it("returns 400 for invalid reschedule data", async () => {
    const scheduleId = await insertSchedule();

    const req = reqAs(
      trainerUser(),
      { scheduleId: scheduleId.toString() },
      { proposed_start_time: "nope" },
    );
    const { res, statusMock } = createMockRes();

    await requestReschedule(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
  });
});

describe("respondToReschedule", () => {
  const pendingRequest = {
    proposed_start_time: PROPOSED,
    proposed_duration_in_minutes: 90,
    status: "pending",
    requested_at: new Date(),
  };

  it("accept moves the schedule to the proposed slot", async () => {
    const scheduleId = await insertSchedule({
      reschedule_request: pendingRequest,
    });

    const req = reqAs(
      clientUser(),
      { scheduleId: scheduleId.toString() },
      { action: "accept" },
    );
    const { res, statusMock, jsonMock } = createMockRes();

    await respondToReschedule(req, res);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock.mock.calls[0][0]).toMatchObject({
      start_time: PROPOSED.toISOString(),
      duration_in_minutes: 90,
      reschedule_request: expect.objectContaining({ status: "accepted" }),
    });
  });

  it("decline keeps the original slot and closes the request", async () => {
    const scheduleId = await insertSchedule({
      reschedule_request: pendingRequest,
    });

    const req = reqAs(
      clientUser(),
      { scheduleId: scheduleId.toString() },
      { action: "decline" },
    );
    const { res, statusMock, jsonMock } = createMockRes();

    await respondToReschedule(req, res);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock.mock.calls[0][0]).toMatchObject({
      start_time: START.toISOString(),
      duration_in_minutes: 60,
      reschedule_request: expect.objectContaining({ status: "declined" }),
    });
  });

  it("returns 403 when the schedule belongs to another client", async () => {
    const scheduleId = await insertSchedule({
      reschedule_request: pendingRequest,
    });

    const req = reqAs(
      clientUser(otherClientId),
      { scheduleId: scheduleId.toString() },
      { action: "accept" },
    );
    const { res, statusMock } = createMockRes();

    await respondToReschedule(req, res);

    expect(statusMock).toHaveBeenCalledWith(403);
  });

  it("returns 409 when there is no pending request", async () => {
    const scheduleId = await insertSchedule();

    const req = reqAs(
      clientUser(),
      { scheduleId: scheduleId.toString() },
      { action: "accept" },
    );
    const { res, statusMock } = createMockRes();

    await respondToReschedule(req, res);

    expect(statusMock).toHaveBeenCalledWith(409);
  });

  it("returns 400 for an invalid action", async () => {
    const scheduleId = await insertSchedule({
      reschedule_request: pendingRequest,
    });

    const req = reqAs(
      clientUser(),
      { scheduleId: scheduleId.toString() },
      { action: "maybe" },
    );
    const { res, statusMock } = createMockRes();

    await respondToReschedule(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
  });
});

describe("deleteClientSchedule", () => {
  it("returns 204 and removes the schedule", async () => {
    const scheduleId = await insertSchedule();

    const req = reqAs(trainerUser(), { scheduleId: scheduleId.toString() });
    const { res, statusMock } = createMockRes();

    await deleteClientSchedule(req, res);

    expect(statusMock).toHaveBeenCalledWith(204);

    const stored = await getDb()
      .collection("schedules")
      .findOne({ _id: scheduleId });
    expect(stored).toBeNull();
  });
});
