import { ObjectId } from "mongodb";
import { close, connect, getDb } from "../../config/database";
import * as userModel from "../../models/User";
import * as clientModel from "../../models/Client";
import { requireClientAccess } from "../../middleware/requireClientAccess";
import { createMockReq } from "../utils/createMockReq";
import { createMockRes } from "../utils/createMockRes";
import { createMockSession } from "../utils/createMockSession";
import type { SessionUser } from "../../types";

beforeAll(async () => {
  await connect();
  await Promise.all([userModel.init(), clientModel.init()]);
});

afterAll(async () => {
  await close();
});

afterEach(async () => {
  await getDb().collection("users").deleteMany({});
  await getDb().collection("clients").deleteMany({});
});

async function makeClient(): Promise<ObjectId> {
  const email = `client-${new ObjectId().toString()}@example.com`;
  await userModel.addUser({
    name: "Client",
    email,
    password_hash: "hash",
    role: "client",
  });
  const user = await userModel.findUserByEmail(email);
  return user!._id!;
}

function sessionUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: new ObjectId().toString(),
    name: "Someone",
    email: "someone@example.com",
    role: "client",
    ...overrides,
  };
}

describe("requireClientAccess", () => {
  it("returns 400 for an invalid client id", async () => {
    const req = createMockReq({
      params: { clientId: "not-an-id" },
      session: createMockSession({ user: sessionUser() }),
    });
    const { res, statusMock, jsonMock } = createMockRes();
    const next = jest.fn();

    await requireClientAccess(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid client id." });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 404 when the client doesn't exist", async () => {
    const req = createMockReq({
      params: { clientId: new ObjectId().toString() },
      session: createMockSession({ user: sessionUser() }),
    });
    const { res, statusMock, jsonMock } = createMockRes();
    const next = jest.fn();

    await requireClientAccess(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Cannot find client." });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 for a client that isn't the caller's own", async () => {
    const clientId = await makeClient();
    const req = createMockReq({
      params: { clientId: clientId.toString() },
      session: createMockSession({ user: sessionUser({ role: "client" }) }),
    });
    const { res, statusMock, jsonMock } = createMockRes();
    const next = jest.fn();

    await requireClientAccess(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Forbidden." });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when the caller is the client themselves", async () => {
    const clientId = await makeClient();
    const req = createMockReq({
      params: { clientId: clientId.toString() },
      session: createMockSession({
        user: sessionUser({ id: clientId.toString(), role: "client" }),
      }),
    });
    const { res, statusMock } = createMockRes();
    const next = jest.fn();

    await requireClientAccess(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });
});
