import { Collection, ObjectId } from "mongodb";
import { getDb } from "../config/database";

export type NotificationType =
  | "link_request_received"
  | "link_request_accepted"
  | "link_request_declined";

export interface Notification {
  _id?: ObjectId;
  recipient_id: ObjectId;
  type: NotificationType;
  link_request_id: ObjectId;
  // Denormalized display text, snapshot at creation time.
  message: string;
  read: boolean;
  created_at: Date;
}

export const collection = (): Collection<Notification> =>
  getDb().collection("notifications");

export const init = async (): Promise<void> => {
  await collection().createIndex({ recipient_id: 1, created_at: -1 });
};

export const addNotification = async (
  notification: Omit<Notification, "_id">,
): Promise<ObjectId> => {
  const result = await collection().insertOne(notification);
  return result.insertedId;
};

/** All notifications for this recipient, newest first. */
export const getNotificationsForRecipient = async (
  recipientId: ObjectId,
): Promise<Notification[]> => {
  return await collection()
    .find({ recipient_id: recipientId })
    .sort({ created_at: -1 })
    .toArray();
};

export const getNotificationById = async (
  notificationId: ObjectId,
): Promise<Notification | null> => {
  return await collection().findOne({ _id: notificationId });
};

export const markRead = async (notificationId: ObjectId): Promise<void> => {
  await collection().updateOne(
    { _id: notificationId },
    { $set: { read: true } },
  );
};

export const markAllReadForRecipient = async (
  recipientId: ObjectId,
): Promise<void> => {
  await collection().updateMany(
    { recipient_id: recipientId, read: false },
    { $set: { read: true } },
  );
};
