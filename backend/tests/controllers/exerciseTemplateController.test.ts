import { getClientExerciseTemplates } from "../../controllers/exerciseTemplateController";
import { createMockReq } from "../utils/createMockReq";
import { createMockRes } from "../utils/createMockRes";

describe("getClientExerciseTemplates", () => {
  it("returns 400 for invalid IDs", async () => {
    const req = createMockReq({ params: { clientId: "bad id" } });
    const { res, statusMock, jsonMock } = createMockRes();

    await getClientExerciseTemplates(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid client id." });
  });
});
