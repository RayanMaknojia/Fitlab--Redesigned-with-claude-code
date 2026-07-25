import {
  addClientExerciseTemplate,
  getClientExerciseTemplates,
} from "../../controllers/exerciseTemplateController";
import { createMockReq } from "../utils/createMockReq";
import { createMockRes } from "../utils/createMockRes";
import { close, connect, getDb } from "../../config/database";
import * as userModel from "../../models/User";
import { ObjectId } from "mongodb";
import {
  addExerciseTemplate,
  deleteTemplateAndAssociatedExercises,
  ExerciseTemplate,
} from "../../models/ExerciseTemplate";

const insertTestUser = async () => {
  return (
    await getDb().collection("users").insertOne({
      name: "test user",
      email: "test@gmail.com",
      password_hash: "testpasswordhash",
      role: "client",
    })
  ).insertedId;
};

describe("getClientExerciseTemplates", () => {
  let testClientId: ObjectId;

  beforeAll(async () => {
    await connect();
    await Promise.all([userModel.init()]);
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

  it("returns 400 for invalid IDs", async () => {
    const req = createMockReq({ params: { clientId: "bad id" } });
    const { res, statusMock, jsonMock } = createMockRes();

    await getClientExerciseTemplates(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid client id." });

    const req2 = createMockReq({ params: { clientId: "" } });
    const {
      res: res2,
      statusMock: statusMock2,
      jsonMock: jsonMock2,
    } = createMockRes();

    await getClientExerciseTemplates(req2, res2);

    expect(statusMock2).toHaveBeenCalledWith(400);
    expect(jsonMock2).toHaveBeenCalledWith({ error: "Invalid client id." });
  });

  it("returns 404 for nonexistent clients", async () => {
    const req = createMockReq({
      params: { clientId: new ObjectId().toString() },
    });

    const { res, statusMock, jsonMock } = createMockRes();

    await getClientExerciseTemplates(req, res);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Cannot find client." });
  });

  it("returns 200 and a client's templates for an existing client", async () => {
    const req = createMockReq({
      params: { clientId: testClientId.toString() },
    });

    const sampleTemplates: ExerciseTemplate[] = [
      { client_id: testClientId, name: "pushups" },
      { client_id: testClientId, name: "test situps" },
    ];

    for (const t of sampleTemplates) {
      t._id = await addExerciseTemplate(t);
    }

    const { res, statusMock, jsonMock } = createMockRes();

    await getClientExerciseTemplates(req, res);

    for (const t of sampleTemplates) {
      await deleteTemplateAndAssociatedExercises(t._id as ObjectId);
    }

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(sampleTemplates);

    const {
      res: res2,
      statusMock: statusMock2,
      jsonMock: jsonMock2,
    } = createMockRes();
    await getClientExerciseTemplates(req, res2);

    expect(statusMock2).toHaveBeenCalledWith(200);
    expect(jsonMock2).toHaveBeenCalledWith([]);
  });
});

describe("addClientExerciseTemplate", () => {
  let testClientId: ObjectId;

  beforeAll(async () => {
    await connect();
    await Promise.all([userModel.init()]);
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
      .collection("exercise_templates")
      .deleteOne({ client_id: testClientId });
    await getDb().collection("clients").deleteOne({ _id: testClientId });
    await getDb().collection("users").deleteOne({ _id: testClientId });
  });

  it("returns 400 for invalid names", async () => {
    const req = createMockReq({
      params: { clientId: testClientId.toString() },
    });

    const { res, statusMock, jsonMock } = createMockRes();

    await addClientExerciseTemplate(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid name." });

    const sampleTemplate = { name: 32 };
    const req2 = createMockReq({
      body: sampleTemplate,
      params: { clientId: testClientId.toString() },
    });

    const {
      res: res2,
      statusMock: statusMock2,
      jsonMock: jsonMock2,
    } = createMockRes();

    await addClientExerciseTemplate(req2, res2);
    expect(statusMock2).toHaveBeenCalledWith(400);
    expect(jsonMock2).toHaveBeenCalledWith({ error: "Invalid name." });
  });

  it("returns 404 for non-existent users", async () => {
    const sampleTemplate = { name: "really hard pushups" };
    const req = createMockReq({
      body: sampleTemplate,
      params: { clientId: new ObjectId().toString() },
    });

    const { res, statusMock, jsonMock } = createMockRes();

    await addClientExerciseTemplate(req, res);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Cannot find client." });
  });

  it("returns 201 and adds a new template for the user", async () => {
    const sampleTemplate = { name: "really hard pushups" };
    const req = createMockReq({
      body: sampleTemplate,
      params: { clientId: testClientId.toString() },
    });

    const { res, statusMock, jsonMock } = createMockRes();

    await addClientExerciseTemplate(req, res);

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      _id: expect.any(ObjectId),
      name: sampleTemplate.name,
      client_id: testClientId,
    });
  });
});

describe("updateExerciseTemplate", async () => {});
