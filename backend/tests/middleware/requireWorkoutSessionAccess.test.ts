import { ObjectId } from "mongodb";
import { close, connect, getDb } from "../../config/database";
import * as userModel from "../../models/User";
import * as clientModel from "../../models/Client";
import * as workoutSessionModel from "../../models/WorkoutSession";
import { requireWorkoutSessionAccess } from "../../middleware/requireWorkoutSessionAccess";
import { createMockReq } from "../utils/createMockReq";
import { createMockRes } from "../utils/createMockRes";
import { createMockSession } from "../utils/createMockSession";
import type { SessionUser } from "../../types";

beforeAll(async () => {
  await connect();
  await Promise.all([
    userModel.init(),
    clientModel.init(),
    workoutSessionModel.init(),
  ]);
});

afterAll(async () => {
  await close();
});

afterEach(async () => {
  await getDb().collection("users").deleteMany({});
  await getDb().collection("clients").deleteMany({});
  await getDb().collection("sessions").deleteMany({});
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

describe("requireWorkoutSessionAccess", () => {
  it("returns 400 for an invalid session id", async () => {
    const req = createMockReq({
      params: { sessionId: "not-an-id" },
      session: createMockSession({ user: sessionUser() }),
    });
    const { res, statusMock, jsonMock } = createMockRes();
    const next = jest.fn();

    await requireWorkoutSessionAccess(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid sessionId." });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 404 when the session doesn't exist", async () => {
    const req = createMockReq({
      params: { sessionId: new ObjectId().toString() },
      session: createMockSession({ user: sessionUser() }),
    });
    const { res, statusMock, jsonMock } = createMockRes();
    const next = jest.fn();

    await requireWorkoutSessionAccess(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Cannot find session." });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when the session belongs to a different client", async () => {
    const clientId = await makeClient();
    const sessionId = await workoutSessionModel.addWorkoutSession({
      client_id: clientId,
      session_date: new Date(),
    });

    const req = createMockReq({
      params: { sessionId: sessionId.toString() },
      session: createMockSession({ user: sessionUser({ role: "client" }) }),
    });
    const { res, statusMock, jsonMock } = createMockRes();
    const next = jest.fn();

    await requireWorkoutSessionAccess(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Forbidden." });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when the session belongs to the caller", async () => {
    const clientId = await makeClient();
    const sessionId = await workoutSessionModel.addWorkoutSession({
      client_id: clientId,
      session_date: new Date(),
    });

    const req = createMockReq({
      params: { sessionId: sessionId.toString() },
      session: createMockSession({
        user: sessionUser({ id: clientId.toString(), role: "client" }),
      }),
    });
    const { res, statusMock } = createMockRes();
    const next = jest.fn();

    await requireWorkoutSessionAccess(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });
});
