import { ObjectId } from "mongodb";
import { close, connect, getDb } from "../../config/database";
import { requireLinkedClient } from "../../middleware/requireLinkedClient";
import { createMockReq } from "../utils/createMockReq";
import { createMockRes } from "../utils/createMockRes";
import { createMockSession } from "../utils/createMockSession";
import type { SessionUser } from "../../types";

let trainerId: ObjectId;
let linkedClientId: ObjectId;
let unlinkedClientId: ObjectId;

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await close();
});

beforeEach(async () => {
  trainerId = new ObjectId();
  linkedClientId = new ObjectId();
  unlinkedClientId = new ObjectId();

  await getDb().collection("clients").insertMany([
    { _id: linkedClientId, trainer_id: trainerId },
    { _id: unlinkedClientId },
  ]);
});

afterEach(async () => {
  await getDb()
    .collection("clients")
    .deleteMany({ _id: { $in: [linkedClientId, unlinkedClientId] } });
});

const trainerUser = (): SessionUser => ({
  id: trainerId.toString(),
  name: "test trainer",
  email: "trainer-linked-mw-test@gmail.com",
  role: "trainer",
});

const makeReq = (clientId: string) =>
  createMockReq({
    params: { clientId },
    session: createMockSession({ user: trainerUser() }),
  });

describe("requireLinkedClient", () => {
  it("returns 400 for an invalid client id", async () => {
    const { res, statusMock, jsonMock } = createMockRes();
    const next = jest.fn();

    await requireLinkedClient(makeReq("not-an-id"), res, next);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid client id." });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 404 for a client not linked to the trainer", async () => {
    const { res, statusMock, jsonMock } = createMockRes();
    const next = jest.fn();

    await requireLinkedClient(makeReq(unlinkedClientId.toString()), res, next);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Client not linked to this trainer.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 404 for a client that does not exist", async () => {
    const { res, statusMock, jsonMock } = createMockRes();
    const next = jest.fn();

    await requireLinkedClient(makeReq(new ObjectId().toString()), res, next);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Client not linked to this trainer.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next for a client linked to the trainer", async () => {
    const { res, statusMock } = createMockRes();
    const next = jest.fn();

    await requireLinkedClient(makeReq(linkedClientId.toString()), res, next);

    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });
});
