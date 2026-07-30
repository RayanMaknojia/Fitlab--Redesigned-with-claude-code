import { createMockReq } from "../utils/createMockReq";
import { createMockRes } from "../utils/createMockRes";
import { createMockSession } from "../utils/createMockSession";
import { requireAdmin } from "../../middleware/requireAdmin";
import type { SessionUser } from "../../types";

describe("requireAdmin", () => {
  it("returns 403 and does not call next when there is no session user", () => {
    const req = createMockReq({ session: createMockSession() });
    const { res, statusMock, jsonMock } = createMockRes();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Admin access required" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 and does not call next for a non-admin role", () => {
    const user: SessionUser = {
      id: "6a5eaaf6318854d554f0382f",
      name: "Someone",
      email: "someone@example.com",
      role: "trainer",
    };
    const req = createMockReq({ session: createMockSession({ user }) });
    const { res, statusMock, jsonMock } = createMockRes();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Admin access required" });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when the session user is an admin", () => {
    const user: SessionUser = {
      id: "6a5eaaf6318854d554f0382f",
      name: "Someone",
      email: "someone@example.com",
      role: "admin",
    };
    const req = createMockReq({ session: createMockSession({ user }) });
    const { res, statusMock } = createMockRes();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });
});
