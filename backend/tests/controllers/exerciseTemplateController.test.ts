import { MongoClient } from "mongodb";
import { getClientExerciseTemplates } from "../../controllers/exerciseTemplateController";
import { createMockReq } from "../utils/createMockReq";
import { createMockRes } from "../utils/createMockRes";
import { close, connect } from "../../config/database";

const CONNECTION_STRING = process.env.CONNECTION_STRING;

if (!CONNECTION_STRING) {
  throw new Error("CONNECTION_STRING is not defined.");
}

describe("getClientExerciseTemplates", () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await close();
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
      params: { clientId: "6a4dc814e52356712f6c98e5" },
    });

    const { res, statusMock, jsonMock } = createMockRes();

    await getClientExerciseTemplates(req, res);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(expect.any(Array));
  });
});
