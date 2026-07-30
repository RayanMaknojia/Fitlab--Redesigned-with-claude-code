import { ObjectId } from "mongodb";
import { close, connect, getDb } from "../../config/database";
import * as userModel from "../../models/User";
import * as clientModel from "../../models/Client";
import { canAccessClient } from "../../utils/clientAccess";
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

async function makeTrainerId(): Promise<string> {
  const email = `trainer-${new ObjectId().toString()}@example.com`;
  await userModel.addUser({
    name: "Trainer",
    email,
    password_hash: "hash",
    role: "trainer",
  });
  const trainer = await userModel.findUserByEmail(email);
  return trainer!._id!.toString();
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

describe("canAccessClient", () => {
  it("returns true when the user is the client themselves", async () => {
    const clientId = await makeClient();
    const user = sessionUser({ id: clientId.toString(), role: "client" });

    expect(await canAccessClient(user, clientId)).toBe(true);
  });

  it("returns false for an unrelated client", async () => {
    const clientId = await makeClient();
    const user = sessionUser({ role: "client" });

    expect(await canAccessClient(user, clientId)).toBe(false);
  });

  it("returns false for a trainer with no link to the client", async () => {
    const clientId = await makeClient();
    const trainerId = await makeTrainerId();
    const user = sessionUser({ id: trainerId, role: "trainer" });

    expect(await canAccessClient(user, clientId)).toBe(false);
  });

  it("returns true for a trainer linked via trainer_id", async () => {
    const clientId = await makeClient();
    const trainerId = await makeTrainerId();
    await getDb()
      .collection("clients")
      .updateOne(
        { _id: clientId },
        { $set: { trainer_id: new ObjectId(trainerId) } },
      );

    const user = sessionUser({ id: trainerId, role: "trainer" });

    expect(await canAccessClient(user, clientId)).toBe(true);
  });

  it("returns false when the client document doesn't exist", async () => {
    const trainerId = await makeTrainerId();
    const user = sessionUser({ id: trainerId, role: "trainer" });

    expect(await canAccessClient(user, new ObjectId())).toBe(false);
  });
});
