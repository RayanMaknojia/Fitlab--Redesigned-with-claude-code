import { getClientExerciseTemplates } from "../../controllers/exerciseTemplateController";
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

describe("getClientExerciseTemplates", () => {
  let testClientId: ObjectId;

  beforeAll(async () => {
    await connect();
    await Promise.all([
      userModel.init(),
      //   clientModel.init(),
      //   workoutSessionModel.init(),
      //   sessionExerciseModel.init(),
      //   exerciseTemplateModel.init(),
      //   scheduleModel.init(),
    ]);
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    testClientId = (
      await getDb().collection("users").insertOne({
        name: "test user",
        email: "test@gmail.com",
        password_hash: "testpasswordhash",
        role: "client",
      })
    ).insertedId;

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
  });

  it("returns 404 for nonexistent clients", async () => {
    const req = createMockReq({
      // This is a fake ID and is very unlikely to exist.
      params: { clientId: "6a6dc614e52356712f6c98e6" },
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

    sampleTemplates.forEach(async (t) => {
      t._id = await addExerciseTemplate(t);
    });

    const { res, statusMock, jsonMock } = createMockRes();

    await getClientExerciseTemplates(req, res);

    sampleTemplates.forEach(
      async (t) =>
        await deleteTemplateAndAssociatedExercises(t._id as ObjectId),
    );

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(sampleTemplates);
  });
});
