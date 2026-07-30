import { createMockReq } from "../utils/createMockReq";
import { createMockRes } from "../utils/createMockRes";
import { createMockSession } from "../utils/createMockSession";
import { requireTrainer } from "../../middleware/requireTrainer";
import type { SessionUser } from "../../types";

const makeUser = (role: "client" | "trainer"): SessionUser => ({
  id: "6a5eaaf6318854d554f0382f",
  name: "Someone",
  email: "someone@example.com",
  role,
});

describe("requireTrainer", () => {
  it("returns 403 and does not call next when there is no session user", () => {
    const req = createMockReq({ session: createMockSession() });
    const { res, statusMock, jsonMock } = createMockRes();
    const next = jest.fn();

    requireTrainer(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Trainer role required." });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 and does not call next when the user is a client", () => {
    const req = createMockReq({
      session: createMockSession({ user: makeUser("client") }),
    });
    const { res, statusMock, jsonMock } = createMockRes();
    const next = jest.fn();

    requireTrainer(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Trainer role required." });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when the user is a trainer", () => {
    const req = createMockReq({
      session: createMockSession({ user: makeUser("trainer") }),
    });
    const { res, statusMock } = createMockRes();
    const next = jest.fn();

    requireTrainer(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });
});
