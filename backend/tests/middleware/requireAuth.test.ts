import { createMockReq } from "../utils/createMockReq";
import { createMockRes } from "../utils/createMockRes";
import { createMockSession } from "../utils/createMockSession";
import { requireAuth } from "../../middleware/requireAuth";
import type { SessionUser } from "../../types";

describe("requireAuth", () => {
  it("returns 401 and does not call next when there is no session user", () => {
    const req = createMockReq({ session: createMockSession() });
    const { res, statusMock, jsonMock } = createMockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Not authenticated" });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when the session has a user", () => {
    const user: SessionUser = {
      id: "6a5eaaf6318854d554f0382f",
      name: "Someone",
      email: "someone@example.com",
      role: "client",
    };
    const req = createMockReq({ session: createMockSession({ user }) });
    const { res, statusMock } = createMockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });
});
