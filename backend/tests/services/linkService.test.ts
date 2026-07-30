import { ObjectId } from "mongodb";
import { close, connect, getDb } from "../../config/database";
import * as linkRequestModel from "../../models/LinkRequest";
import * as linkService from "../../services/linkService";

let trainerId: ObjectId;
let otherTrainerId: ObjectId;
let clientId: ObjectId;

const TRAINER_EMAIL = "trainer-link-test@gmail.com";
const OTHER_TRAINER_EMAIL = "trainer2-link-test@gmail.com";
const CLIENT_EMAIL = "client-link-test@gmail.com";

beforeAll(async () => {
  await connect();
  await linkRequestModel.init();
});

afterAll(async () => {
  await close();
});

beforeEach(async () => {
  const db = getDb();

  trainerId = (
    await db.collection("users").insertOne({
      name: "link trainer",
      email: TRAINER_EMAIL,
      password_hash: "hash",
      role: "trainer",
    })
  ).insertedId;

  otherTrainerId = (
    await db.collection("users").insertOne({
      name: "other trainer",
      email: OTHER_TRAINER_EMAIL,
      password_hash: "hash",
      role: "trainer",
    })
  ).insertedId;

  clientId = (
    await db.collection("users").insertOne({
      name: "link client",
      email: CLIENT_EMAIL,
      password_hash: "hash",
      role: "client",
    })
  ).insertedId;

  await db.collection("clients").insertOne({ _id: clientId });
});

afterEach(async () => {
  const db = getDb();
  await db.collection("link_requests").deleteMany({});
  await db.collection("clients").deleteMany({ _id: clientId });
  await db
    .collection("users")
    .deleteMany({ _id: { $in: [trainerId, otherTrainerId, clientId] } });
});

describe("sendRequestToClient", () => {
  it("creates a pending request for a client email (case-insensitive)", async () => {
    const view = await linkService.sendRequestToClient(
      trainerId,
      `  ${CLIENT_EMAIL.toUpperCase()}  `,
    );

    expect(view.status).toBe("pending");
    expect(view.requested_by).toBe("trainer");
    expect(view.trainer_email).toBe(TRAINER_EMAIL);
    expect(view.client_email).toBe(CLIENT_EMAIL);
  });

  it("rejects an email that is not registered", async () => {
    await expect(
      linkService.sendRequestToClient(trainerId, "nobody@example.com"),
    ).rejects.toBeInstanceOf(linkService.EmailNotFoundError);
  });

  it("rejects an email that belongs to a trainer, not a client", async () => {
    await expect(
      linkService.sendRequestToClient(trainerId, OTHER_TRAINER_EMAIL),
    ).rejects.toBeInstanceOf(linkService.NotAClientEmailError);
  });

  it("rejects when the client already has a trainer", async () => {
    await getDb()
      .collection("clients")
      .updateOne({ _id: clientId }, { $set: { trainer_id: otherTrainerId } });

    await expect(
      linkService.sendRequestToClient(trainerId, CLIENT_EMAIL),
    ).rejects.toBeInstanceOf(linkService.ClientHasTrainerError);
  });

  it("rejects when the client is already linked to this trainer", async () => {
    await getDb()
      .collection("clients")
      .updateOne({ _id: clientId }, { $set: { trainer_id: trainerId } });

    await expect(
      linkService.sendRequestToClient(trainerId, CLIENT_EMAIL),
    ).rejects.toBeInstanceOf(linkService.AlreadyLinkedError);
  });

  it("rejects a duplicate pending request for the same pair", async () => {
    await linkService.sendRequestToClient(trainerId, CLIENT_EMAIL);

    await expect(
      linkService.sendRequestToClient(trainerId, CLIENT_EMAIL),
    ).rejects.toBeInstanceOf(linkService.DuplicatePendingRequestError);
  });
});

describe("sendRequestToTrainer", () => {
  it("creates a pending request for a trainer email", async () => {
    const view = await linkService.sendRequestToTrainer(
      clientId,
      TRAINER_EMAIL,
    );

    expect(view.status).toBe("pending");
    expect(view.requested_by).toBe("client");
    expect(view.trainer_id).toBe(trainerId.toString());
  });

  it("rejects an email that belongs to a client, not a trainer", async () => {
    await expect(
      linkService.sendRequestToTrainer(clientId, CLIENT_EMAIL),
    ).rejects.toBeInstanceOf(linkService.NotATrainerEmailError);
  });

  it("rejects an email that is not registered", async () => {
    await expect(
      linkService.sendRequestToTrainer(clientId, "nobody@example.com"),
    ).rejects.toBeInstanceOf(linkService.EmailNotFoundError);
  });

  it("rejects when the client already has a trainer", async () => {
    await getDb()
      .collection("clients")
      .updateOne({ _id: clientId }, { $set: { trainer_id: otherTrainerId } });

    await expect(
      linkService.sendRequestToTrainer(clientId, TRAINER_EMAIL),
    ).rejects.toBeInstanceOf(linkService.ClientHasTrainerError);
  });
});

describe("respondToRequest", () => {
  it("only lets the receiving side respond", async () => {
    const view = await linkService.sendRequestToClient(trainerId, CLIENT_EMAIL);
    const requestId = new ObjectId(view.request_id);

    // The trainer initiated, so the trainer cannot accept their own request.
    await expect(
      linkService.respondToRequest(trainerId, requestId, true),
    ).rejects.toBeInstanceOf(linkService.RequestAccessError);
  });

  it("accepting links the client and auto-declines other pending requests", async () => {
    const fromTrainer = await linkService.sendRequestToClient(
      trainerId,
      CLIENT_EMAIL,
    );
    const fromOtherTrainer = await linkService.sendRequestToClient(
      otherTrainerId,
      CLIENT_EMAIL,
    );

    const accepted = await linkService.respondToRequest(
      clientId,
      new ObjectId(fromTrainer.request_id),
      true,
    );

    expect(accepted.status).toBe("accepted");

    const client = await getDb()
      .collection("clients")
      .findOne({ _id: clientId });
    expect(client?.trainer_id?.toString()).toBe(trainerId.toString());

    const other = await getDb()
      .collection("link_requests")
      .findOne({ _id: new ObjectId(fromOtherTrainer.request_id) });
    expect(other?.status).toBe("declined");
  });

  it("declining keeps the client unlinked", async () => {
    const view = await linkService.sendRequestToClient(trainerId, CLIENT_EMAIL);

    const declined = await linkService.respondToRequest(
      clientId,
      new ObjectId(view.request_id),
      false,
    );

    expect(declined.status).toBe("declined");

    const client = await getDb()
      .collection("clients")
      .findOne({ _id: clientId });
    expect(client?.trainer_id).toBeUndefined();
  });

  it("cannot accept when the client linked with another trainer meanwhile", async () => {
    const view = await linkService.sendRequestToClient(trainerId, CLIENT_EMAIL);

    await getDb()
      .collection("clients")
      .updateOne({ _id: clientId }, { $set: { trainer_id: otherTrainerId } });

    await expect(
      linkService.respondToRequest(
        clientId,
        new ObjectId(view.request_id),
        true,
      ),
    ).rejects.toBeInstanceOf(linkService.ClientHasTrainerError);

    // The unfulfillable request is closed out rather than left pending.
    const request = await getDb()
      .collection("link_requests")
      .findOne({ _id: new ObjectId(view.request_id) });
    expect(request?.status).toBe("declined");
  });

  it("rejects responses to already-settled requests", async () => {
    const view = await linkService.sendRequestToClient(trainerId, CLIENT_EMAIL);
    const requestId = new ObjectId(view.request_id);

    await linkService.respondToRequest(clientId, requestId, false);

    await expect(
      linkService.respondToRequest(clientId, requestId, true),
    ).rejects.toBeInstanceOf(linkService.RequestNotFoundError);
  });
});

describe("pending request listings", () => {
  it("returns the request to both sides while pending, and neither side after", async () => {
    const view = await linkService.sendRequestToClient(trainerId, CLIENT_EMAIL);

    const forTrainer = await linkService.getPendingRequestsForTrainer(trainerId);
    const forClient = await linkService.getPendingRequestsForClient(clientId);

    expect(forTrainer.map((r) => r.request_id)).toEqual([view.request_id]);
    expect(forClient.map((r) => r.request_id)).toEqual([view.request_id]);

    await linkService.respondToRequest(
      clientId,
      new ObjectId(view.request_id),
      true,
    );

    expect(await linkService.getPendingRequestsForTrainer(trainerId)).toEqual([]);
    expect(await linkService.getPendingRequestsForClient(clientId)).toEqual([]);
  });
});

describe("unlinking", () => {
  it("trainer can unlink their own client, but not someone else's", async () => {
    await getDb()
      .collection("clients")
      .updateOne({ _id: clientId }, { $set: { trainer_id: trainerId } });

    await expect(
      linkService.unlinkClientFromTrainer(otherTrainerId, clientId),
    ).rejects.toBeInstanceOf(linkService.NotLinkedError);

    await linkService.unlinkClientFromTrainer(trainerId, clientId);

    const client = await getDb()
      .collection("clients")
      .findOne({ _id: clientId });
    expect(client?.trainer_id).toBeUndefined();
  });

  it("client can unlink from their trainer, and errors when not linked", async () => {
    await getDb()
      .collection("clients")
      .updateOne({ _id: clientId }, { $set: { trainer_id: trainerId } });

    await linkService.unlinkTrainerFromClient(clientId);

    expect(await linkService.getLinkedTrainer(clientId)).toBeNull();

    await expect(
      linkService.unlinkTrainerFromClient(clientId),
    ).rejects.toBeInstanceOf(linkService.NotLinkedError);
  });
});

describe("getLinkedTrainer", () => {
  it("returns the linked trainer's profile", async () => {
    await getDb()
      .collection("clients")
      .updateOne({ _id: clientId }, { $set: { trainer_id: trainerId } });

    expect(await linkService.getLinkedTrainer(clientId)).toEqual({
      trainer_id: trainerId.toString(),
      name: "link trainer",
      email: TRAINER_EMAIL,
    });
  });
});
