import { ObjectId } from "mongodb";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../controllers/notificationController";
import { createMockReq } from "../utils/createMockReq";
import { createMockRes } from "../utils/createMockRes";
import { createMockSession } from "../utils/createMockSession";
import { close, connect, getDb } from "../../config/database";
import * as notificationModel from "../../models/Notification";

let recipientId: ObjectId;
let otherUserId: ObjectId;

beforeAll(async () => {
  await connect();
  await notificationModel.init();
});

afterAll(async () => {
  await close();
});

beforeEach(async () => {
  const db = getDb();

  recipientId = (
    await db.collection("users").insertOne({
      name: "notif recipient",
      email: "notif-recipient@gmail.com",
      password_hash: "hash",
      role: "client",
    })
  ).insertedId;

  otherUserId = (
    await db.collection("users").insertOne({
      name: "other user",
      email: "notif-other@gmail.com",
      password_hash: "hash",
      role: "trainer",
    })
  ).insertedId;
});

afterEach(async () => {
  const db = getDb();
  await db.collection("notifications").deleteMany({});
  await db
    .collection("users")
    .deleteMany({ _id: { $in: [recipientId, otherUserId] } });
});

const sessionFor = (userId: ObjectId, role: "client" | "trainer") =>
  createMockSession({
    user: { id: userId.toString(), name: "x", email: "x@example.com", role },
  });

describe("getMyNotifications", () => {
  it("returns only the caller's notifications, newest first", async () => {
    const older = await notificationModel.addNotification({
      recipient_id: recipientId,
      type: "link_request_received",
      link_request_id: new ObjectId(),
      message: "older",
      read: false,
      created_at: new Date(Date.now() - 1000),
    });
    const newer = await notificationModel.addNotification({
      recipient_id: recipientId,
      type: "link_request_accepted",
      link_request_id: new ObjectId(),
      message: "newer",
      read: false,
      created_at: new Date(),
    });
    await notificationModel.addNotification({
      recipient_id: otherUserId,
      type: "link_request_received",
      link_request_id: new ObjectId(),
      message: "not mine",
      read: false,
      created_at: new Date(),
    });

    const req = createMockReq({ session: sessionFor(recipientId, "client") });
    const { res, statusMock, jsonMock } = createMockRes();

    await getMyNotifications(req, res);

    expect(statusMock).toHaveBeenCalledWith(200);
    const results = jsonMock.mock.calls[0][0];
    expect(results.map((n: { notification_id: string }) => n.notification_id)).toEqual([
      newer.toString(),
      older.toString(),
    ]);
  });
});

describe("markNotificationRead", () => {
  it("marks the caller's own notification read", async () => {
    const id = await notificationModel.addNotification({
      recipient_id: recipientId,
      type: "link_request_received",
      link_request_id: new ObjectId(),
      message: "hi",
      read: false,
      created_at: new Date(),
    });

    const req = createMockReq({
      session: sessionFor(recipientId, "client"),
      params: { notificationId: id.toString() },
    });
    const { res, statusMock } = createMockRes();

    await markNotificationRead(req, res);

    expect(statusMock).toHaveBeenCalledWith(204);
    const updated = await notificationModel.getNotificationById(id);
    expect(updated?.read).toBe(true);
  });

  it("returns 404 for someone else's notification", async () => {
    const id = await notificationModel.addNotification({
      recipient_id: otherUserId,
      type: "link_request_received",
      link_request_id: new ObjectId(),
      message: "not yours",
      read: false,
      created_at: new Date(),
    });

    const req = createMockReq({
      session: sessionFor(recipientId, "client"),
      params: { notificationId: id.toString() },
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await markNotificationRead(req, res);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Cannot find notification.",
    });
  });

  it("returns 400 for an invalid id", async () => {
    const req = createMockReq({
      session: sessionFor(recipientId, "client"),
      params: { notificationId: "bad id" },
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await markNotificationRead(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Invalid notification id.",
    });
  });
});

describe("markAllNotificationsRead", () => {
  it("marks every one of the caller's unread notifications read", async () => {
    await notificationModel.addNotification({
      recipient_id: recipientId,
      type: "link_request_received",
      link_request_id: new ObjectId(),
      message: "one",
      read: false,
      created_at: new Date(),
    });
    await notificationModel.addNotification({
      recipient_id: recipientId,
      type: "link_request_accepted",
      link_request_id: new ObjectId(),
      message: "two",
      read: false,
      created_at: new Date(),
    });

    const req = createMockReq({ session: sessionFor(recipientId, "client") });
    const { res, statusMock } = createMockRes();

    await markAllNotificationsRead(req, res);

    expect(statusMock).toHaveBeenCalledWith(204);
    const all = await notificationModel.getNotificationsForRecipient(recipientId);
    expect(all.every((n) => n.read)).toBe(true);
  });
});
