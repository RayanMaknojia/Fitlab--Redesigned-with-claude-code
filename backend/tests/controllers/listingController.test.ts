import { ObjectId } from "mongodb";
import {
  browseListings,
  connectToListing,
  deleteMyListing,
  getListing,
  getListingByUser,
  getMyListing,
  upsertMyListing,
} from "../../controllers/listingController";
import { createMockReq } from "../utils/createMockReq";
import { createMockRes } from "../utils/createMockRes";
import { createMockSession } from "../utils/createMockSession";
import { close, connect, getDb } from "../../config/database";
import * as listingModel from "../../models/Listing";
import * as linkRequestModel from "../../models/LinkRequest";

let clientId: ObjectId;
let trainerId: ObjectId;
let otherTrainerId: ObjectId;

beforeAll(async () => {
  await connect();
  await listingModel.init();
  await linkRequestModel.init();
});

afterAll(async () => {
  await close();
});

beforeEach(async () => {
  const db = getDb();

  clientId = (
    await db.collection("users").insertOne({
      name: "listing client",
      email: "listing-client@gmail.com",
      password_hash: "hash",
      role: "client",
    })
  ).insertedId;

  trainerId = (
    await db.collection("users").insertOne({
      name: "listing trainer",
      email: "listing-trainer@gmail.com",
      password_hash: "hash",
      role: "trainer",
    })
  ).insertedId;

  otherTrainerId = (
    await db.collection("users").insertOne({
      name: "other listing trainer",
      email: "listing-trainer-2@gmail.com",
      password_hash: "hash",
      role: "trainer",
    })
  ).insertedId;

  await db.collection("clients").insertOne({ _id: clientId });
});

afterEach(async () => {
  const db = getDb();
  await db.collection("listings").deleteMany({});
  await db.collection("link_requests").deleteMany({});
  await db.collection("notifications").deleteMany({});
  await db.collection("clients").deleteMany({ _id: clientId });
  await db
    .collection("users")
    .deleteMany({ _id: { $in: [clientId, trainerId, otherTrainerId] } });
});

const sessionFor = (userId: ObjectId, role: "client" | "trainer", name: string) =>
  createMockSession({
    user: { id: userId.toString(), name, email: "x@example.com", role },
  });

describe("upsertMyListing / getMyListing / deleteMyListing", () => {
  it("creates a listing, then updates it in place", async () => {
    const req = createMockReq({
      session: sessionFor(trainerId, "trainer", "listing trainer"),
      body: { headline: "Strength coach", bio: "10 years experience." },
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await upsertMyListing(req, res);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "trainer",
        name: "listing trainer",
        headline: "Strength coach",
        bio: "10 years experience.",
      }),
    );

    const req2 = createMockReq({
      session: sessionFor(trainerId, "trainer", "listing trainer"),
      body: { headline: "Updated headline", bio: "Still coaching." },
    });
    const { res: res2, statusMock: statusMock2 } = createMockRes();

    await upsertMyListing(req2, res2);
    expect(statusMock2).toHaveBeenCalledWith(200);

    const all = await getDb().collection("listings").find({ user_id: trainerId }).toArray();
    expect(all).toHaveLength(1);
    expect(all[0]!.headline).toBe("Updated headline");
  });

  it("rejects an empty headline or bio", async () => {
    const req = createMockReq({
      session: sessionFor(trainerId, "trainer", "listing trainer"),
      body: { headline: "", bio: "Still coaching." },
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await upsertMyListing(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "A headline and bio are required.",
    });
  });

  it("getMyListing returns null when the caller has no listing", async () => {
    const req = createMockReq({
      session: sessionFor(trainerId, "trainer", "listing trainer"),
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await getMyListing(req, res);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ listing: null });
  });

  it("deleteMyListing removes the caller's listing", async () => {
    await listingModel.upsertListing(
      trainerId,
      "trainer",
      "listing trainer",
      "Strength coach",
      "Bio.",
    );

    const req = createMockReq({
      session: sessionFor(trainerId, "trainer", "listing trainer"),
    });
    const { res, statusMock } = createMockRes();

    await deleteMyListing(req, res);

    expect(statusMock).toHaveBeenCalledWith(204);
    expect(await listingModel.getListingByUserId(trainerId)).toBeNull();
  });
});

describe("browseListings", () => {
  it("returns active listings of the opposite role only", async () => {
    await listingModel.upsertListing(
      trainerId,
      "trainer",
      "listing trainer",
      "Strength coach",
      "Bio.",
    );
    await listingModel.upsertListing(
      clientId,
      "client",
      "listing client",
      "Looking for a coach",
      "Bio.",
    );

    const req = createMockReq({
      session: sessionFor(clientId, "client", "listing client"),
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await browseListings(req, res);

    expect(statusMock).toHaveBeenCalledWith(200);
    const results = jsonMock.mock.calls[0][0];
    expect(results).toHaveLength(1);
    expect(results[0].role).toBe("trainer");
  });
});

describe("getListing", () => {
  it("returns 404 for a listing that does not exist", async () => {
    const req = createMockReq({
      session: sessionFor(clientId, "client", "listing client"),
      params: { listingId: new ObjectId().toString() },
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await getListing(req, res);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Cannot find listing." });
  });
});

describe("getListingByUser", () => {
  it("returns the listing belonging to that user id", async () => {
    await listingModel.upsertListing(
      trainerId,
      "trainer",
      "listing trainer",
      "Strength coach",
      "Bio.",
    );

    const req = createMockReq({
      session: sessionFor(clientId, "client", "listing client"),
      params: { userId: trainerId.toString() },
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await getListingByUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: trainerId.toString() }),
    );
  });

  it("returns 404 when that user has no listing", async () => {
    const req = createMockReq({
      session: sessionFor(clientId, "client", "listing client"),
      params: { userId: trainerId.toString() },
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await getListingByUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Cannot find listing." });
  });
});

describe("connectToListing", () => {
  it("sends a connection request from a client to a trainer's listing", async () => {
    await listingModel.upsertListing(
      trainerId,
      "trainer",
      "listing trainer",
      "Strength coach",
      "Bio.",
    );
    const listing = await listingModel.getListingByUserId(trainerId);

    const req = createMockReq({
      session: sessionFor(clientId, "client", "listing client"),
      params: { listingId: listing!._id!.toString() },
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await connectToListing(req, res);

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "pending",
        requested_by: "client",
        trainer_id: trainerId.toString(),
        client_id: clientId.toString(),
      }),
    );

    const notifications = await getDb()
      .collection("notifications")
      .find({ recipient_id: trainerId })
      .toArray();
    expect(notifications).toHaveLength(1);
    expect(notifications[0]!.type).toBe("link_request_received");
  });

  it("rejects connecting to a listing of the caller's own role", async () => {
    await listingModel.upsertListing(
      otherTrainerId,
      "trainer",
      "other listing trainer",
      "Strength coach",
      "Bio.",
    );
    const listing = await listingModel.getListingByUserId(otherTrainerId);

    const req = createMockReq({
      session: sessionFor(trainerId, "trainer", "listing trainer"),
      params: { listingId: listing!._id!.toString() },
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await connectToListing(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Cannot send a connection request to your own role.",
    });
  });

  it("returns 409 for a duplicate pending request", async () => {
    await listingModel.upsertListing(
      trainerId,
      "trainer",
      "listing trainer",
      "Strength coach",
      "Bio.",
    );
    const listing = await listingModel.getListingByUserId(trainerId);

    const req = createMockReq({
      session: sessionFor(clientId, "client", "listing client"),
      params: { listingId: listing!._id!.toString() },
    });

    const { res: res1 } = createMockRes();
    await connectToListing(req, res1);

    const { res: res2, statusMock: statusMock2, jsonMock: jsonMock2 } =
      createMockRes();
    await connectToListing(req, res2);

    expect(statusMock2).toHaveBeenCalledWith(409);
    expect(jsonMock2).toHaveBeenCalledWith({
      error: "A link request between you two is already pending.",
    });
  });
});
