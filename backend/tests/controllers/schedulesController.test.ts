import { createMockReq } from "../utils/createMockReq";
import { createMockRes } from "../utils/createMockRes";
import { close, connect, getDb } from "../../config/database";
import * as userModel from "../../models/User";
import { ObjectId } from "mongodb";
import { insertTestUser } from "../utils/insertTestUser";
import {
  addSchedule,
  deleteSchedule,
  getSchedules,
  Schedule,
} from "../../models/Schedule";
import {
  addClientSchedule,
  deleteClientSchedule,
  getClientSchedules,
} from "../../controllers/schedulesController";

describe("getClientSchedules", () => {
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
    await getDb().collection("clients").deleteOne({ _id: testClientId });
    await getDb().collection("users").deleteOne({ _id: testClientId });
  });

  it("returns 200 and a client's schedules", async () => {
    const req = createMockReq({
      params: { clientId: testClientId.toString() },
    });

    const { res, statusMock, jsonMock } = createMockRes();

    await getClientSchedules(req, res);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith([]);

    const sampleSchedules: Schedule[] = [
      {
        client_id: testClientId,
        start_time: new Date(),
        duration_in_minutes: 50,
      },
      {
        client_id: testClientId,
        start_time: new Date("2021-04-10T14:48:00.000+09:00"),
        duration_in_minutes: 20,
      },
    ];

    for (const s of sampleSchedules) {
      const resultId = await addSchedule(s);
      s._id = resultId;
    }

    const {
      res: res2,
      statusMock: statusMock2,
      jsonMock: jsonMock2,
    } = createMockRes();

    await getClientSchedules(req, res2);

    for (const s of sampleSchedules) {
      await deleteSchedule(s._id as ObjectId);
    }

    expect(statusMock2).toHaveBeenCalledWith(200);
    expect(jsonMock2).toHaveBeenCalledWith(sampleSchedules);
  });

  it("returns 404 for nonexistent clients", async () => {
    const req = createMockReq({
      params: { clientId: new ObjectId().toString() },
    });

    const { res, statusMock } = createMockRes();

    await getClientSchedules(req, res);

    expect(statusMock).toHaveBeenCalledWith(404);
  });
});

describe("addClientSchedule", () => {
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
    await getDb()
      .collection("schedules")
      .deleteMany({ client_id: testClientId });
    await getDb().collection("clients").deleteOne({ _id: testClientId });
    await getDb().collection("users").deleteOne({ _id: testClientId });
  });

  it("returns 201 and adds a new schedule for the client", async () => {
    const sampleSchedule: Schedule = {
      client_id: testClientId,
      start_time: new Date(),
      duration_in_minutes: 50,
    };

    const req = createMockReq({
      params: { clientId: testClientId.toString() },
      body: sampleSchedule,
    });

    const { res, statusMock, jsonMock } = createMockRes();

    await addClientSchedule(req, res);

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      _id: expect.any(ObjectId),
      ...sampleSchedule,
    });

    expect(await getSchedules(testClientId)).toEqual([
      {
        _id: expect.any(ObjectId),
        ...sampleSchedule,
      },
    ]);
  });

  it("returns 400 on bad schedule data", async () => {
    const expectedError = { error: "Invalid schedule data." };
    const req = createMockReq({
      params: { clientId: testClientId.toString() },
    });

    const { res, statusMock, jsonMock } = createMockRes();

    await addClientSchedule(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(expectedError);

    const sampleSchedule: Omit<Schedule, "client_id"> = {
      start_time: new Date("hello"),
      duration_in_minutes: 20,
    };

    const req2 = createMockReq({
      params: { clientId: testClientId.toString() },
      body: sampleSchedule,
    });

    const {
      res: res2,
      statusMock: statusMock2,
      jsonMock: jsonMock2,
    } = createMockRes();

    await addClientSchedule(req2, res2);

    expect(statusMock2).toHaveBeenCalledWith(400);
    expect(jsonMock2).toHaveBeenCalledWith(expectedError);

    const sampleSchedule2: Omit<Schedule, "client_id"> = {
      start_time: new Date(),
      duration_in_minutes: 0.25,
    };

    const req3 = createMockReq({
      params: { clientId: testClientId.toString() },
      body: sampleSchedule2,
    });

    const {
      res: res3,
      statusMock: statusMock3,
      jsonMock: jsonMock3,
    } = createMockRes();

    await addClientSchedule(req3, res3);

    expect(statusMock3).toHaveBeenCalledWith(400);
    expect(jsonMock3).toHaveBeenCalledWith(expectedError);
  });
});

describe("deleteClientSchedule", () => {
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
    await getDb()
      .collection("schedules")
      .deleteMany({ client_id: testClientId });
    await getDb().collection("clients").deleteOne({ _id: testClientId });
    await getDb().collection("users").deleteOne({ _id: testClientId });
  });

  it("returns 204 and deletes the schedule and returns 404 when trying to delete it again", async () => {
    const sampleSchedules: Schedule[] = [
      {
        client_id: testClientId,
        start_time: new Date(),
        duration_in_minutes: 20,
      },
      {
        client_id: testClientId,
        start_time: new Date("2026-05-02"),
        duration_in_minutes: 40,
      },
      {
        client_id: testClientId,
        start_time: new Date("2011-10-10T14:48:00"),
        duration_in_minutes: 10,
      },
    ];

    for (const s of sampleSchedules) {
      const resultId = await addSchedule(s);
      s._id = resultId;
    }

    expect(await getSchedules(testClientId)).toEqual(sampleSchedules);

    const scheduleToDeleteId = sampleSchedules[1]?._id as ObjectId;

    const req = createMockReq({
      params: { scheduleId: scheduleToDeleteId.toString() },
    });

    const { res, statusMock } = createMockRes();

    await deleteClientSchedule(req, res);

    expect(statusMock).toHaveBeenCalledWith(204);
    expect(await getSchedules(testClientId)).toEqual([
      sampleSchedules[0],
      sampleSchedules[2],
    ]);

    const { res: res2, jsonMock, statusMock: statusMock2 } = createMockRes();

    await deleteClientSchedule(req, res2);
    expect(statusMock2).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Cannot find schedule." });
  });
});
