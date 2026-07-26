import { createMockReq } from "../utils/createMockReq";
import { createMockRes } from "../utils/createMockRes";
import { close, connect, getDb } from "../../config/database";
import * as userModel from "../../models/User";
import { ObjectId } from "mongodb";
import { insertTestUser } from "../utils/insertTestUser";
import { addSchedule, deleteSchedule, Schedule } from "../../models/Schedule";
import { getClientSchedules } from "../../controllers/schedulesController";

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

describe("addClientSchedule", () => {});

describe("deleteClientSchedule", () => {});
