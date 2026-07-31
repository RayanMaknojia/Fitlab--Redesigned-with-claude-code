import { ObjectId } from "mongodb";
import {
  blockUser,
  unblockUser,
  getAllListings,
  removeListing,
} from "../../controllers/adminController";
import { createMockReq } from "../utils/createMockReq";
import { createMockRes } from "../utils/createMockRes";
import { createMockSession } from "../utils/createMockSession";
import { close, connect, getDb } from "../../config/database";
import * as userModel from "../../models/User";
import * as listingModel from "../../models/Listing";

let adminId: ObjectId;
let otherAdminId: ObjectId;
let clientId: ObjectId;
let trainerId: ObjectId;

beforeAll(async () => {
  await connect();
  await userModel.init();
  await listingModel.init();
});

afterAll(async () => {
  await close();
});

beforeEach(async () => {
  const db = getDb();

  adminId = (
    await db.collection("users").insertOne({
      name: "admin one",
      email: "admin-test-1@gmail.com",
      password_hash: "hash",
      role: "admin",
    })
  ).insertedId;

  otherAdminId = (
    await db.collection("users").insertOne({
      name: "admin two",
      email: "admin-test-2@gmail.com",
      password_hash: "hash",
      role: "admin",
    })
  ).insertedId;

  clientId = (
    await db.collection("users").insertOne({
      name: "admin test client",
      email: "admin-test-client@gmail.com",
      password_hash: "hash",
      role: "client",
    })
  ).insertedId;

  trainerId = (
    await db.collection("users").insertOne({
      name: "admin test trainer",
      email: "admin-test-trainer@gmail.com",
      password_hash: "hash",
      role: "trainer",
    })
  ).insertedId;
});

afterEach(async () => {
  const db = getDb();
  await db.collection("listings").deleteMany({});
  await db.collection("users").deleteMany({
    _id: { $in: [adminId, otherAdminId, clientId, trainerId] },
  });
});

const sessionFor = (userId: ObjectId) =>
  createMockSession({
    user: { id: userId.toString(), name: "x", email: "x@example.com", role: "admin" },
  });

describe("blockUser", () => {
  it("blocks a user and removes their listing", async () => {
    await listingModel.upsertListing(
      clientId,
      "client",
      "admin test client",
      "Seeking a coach",
      "Bio.",
    );

    const req = createMockReq({
      session: sessionFor(adminId),
      params: { userId: clientId.toString() },
    });
    const { res, statusMock } = createMockRes();

    await blockUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(204);

    const user = await userModel.findUserById(clientId);
    expect(user?.blocked).toBe(true);

    const listing = await listingModel.getListingByUserId(clientId);
    expect(listing?.status).toBe("removed");
    expect(listing?.removed_by?.toString()).toBe(adminId.toString());
  });

  it("blocks a user with no listing without error", async () => {
    const req = createMockReq({
      session: sessionFor(adminId),
      params: { userId: trainerId.toString() },
    });
    const { res, statusMock } = createMockRes();

    await blockUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(204);
    const user = await userModel.findUserById(trainerId);
    expect(user?.blocked).toBe(true);
  });

  it("returns 400 when trying to block yourself", async () => {
    const req = createMockReq({
      session: sessionFor(adminId),
      params: { userId: adminId.toString() },
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await blockUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "You cannot block your own account.",
    });
  });

  it("returns 400 when trying to block another admin", async () => {
    const req = createMockReq({
      session: sessionFor(adminId),
      params: { userId: otherAdminId.toString() },
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await blockUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Cannot block another admin.",
    });
  });

  it("returns 404 for a nonexistent user", async () => {
    const req = createMockReq({
      session: sessionFor(adminId),
      params: { userId: new ObjectId().toString() },
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await blockUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Cannot find user." });
  });

  it("returns 400 for an invalid user id", async () => {
    const req = createMockReq({
      session: sessionFor(adminId),
      params: { userId: "bad id" },
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await blockUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid user id." });
  });
});

describe("unblockUser", () => {
  it("unblocks a blocked user", async () => {
    await userModel.setUserBlocked(clientId, true);

    const req = createMockReq({
      session: sessionFor(adminId),
      params: { userId: clientId.toString() },
    });
    const { res, statusMock } = createMockRes();

    await unblockUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(204);
    const user = await userModel.findUserById(clientId);
    expect(user?.blocked).toBe(false);
  });

  it("returns 404 for a nonexistent user", async () => {
    const req = createMockReq({
      session: sessionFor(adminId),
      params: { userId: new ObjectId().toString() },
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await unblockUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Cannot find user." });
  });
});

describe("getAllListings", () => {
  it("returns every listing regardless of role or status", async () => {
    await listingModel.upsertListing(
      clientId,
      "client",
      "admin test client",
      "Seeking a coach",
      "Bio.",
    );
    await listingModel.upsertListing(
      trainerId,
      "trainer",
      "admin test trainer",
      "Strength coach",
      "Bio.",
    );

    const req = createMockReq({ session: sessionFor(adminId) });
    const { res, statusMock, jsonMock } = createMockRes();

    await getAllListings(req, res);

    expect(statusMock).toHaveBeenCalledWith(200);
    const results = jsonMock.mock.calls[0][0];
    expect(results).toHaveLength(2);
  });
});

describe("removeListing", () => {
  it("removes a listing with a reason", async () => {
    await listingModel.upsertListing(
      clientId,
      "client",
      "admin test client",
      "Seeking a coach",
      "Bio.",
    );
    const listing = await listingModel.getListingByUserId(clientId);

    const req = createMockReq({
      session: sessionFor(adminId),
      params: { listingId: listing!._id!.toString() },
      body: { reason: "Offensive content" },
    });
    const { res, statusMock } = createMockRes();

    await removeListing(req, res);

    expect(statusMock).toHaveBeenCalledWith(204);
    const updated = await listingModel.getListingById(listing!._id!);
    expect(updated?.status).toBe("removed");
    expect(updated?.removed_reason).toBe("Offensive content");
    expect(updated?.removed_by?.toString()).toBe(adminId.toString());
  });

  it("returns 404 for a nonexistent listing", async () => {
    const req = createMockReq({
      session: sessionFor(adminId),
      params: { listingId: new ObjectId().toString() },
      body: {},
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await removeListing(req, res);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Cannot find listing." });
  });

  it("returns 400 for an invalid listing id", async () => {
    const req = createMockReq({
      session: sessionFor(adminId),
      params: { listingId: "bad id" },
      body: {},
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await removeListing(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid listing id." });
  });
});
