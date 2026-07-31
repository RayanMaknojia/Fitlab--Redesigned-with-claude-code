import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import * as notificationModel from "../models/Notification";
import { parseObjectId } from "../utils/parseObjectId";

const sessionUserId = (req: Request): ObjectId =>
  new ObjectId(req.session.user!.id);

const toPublicNotification = (notification: notificationModel.Notification) => ({
  notification_id: notification._id!.toString(),
  type: notification.type,
  link_request_id: notification.link_request_id.toString(),
  message: notification.message,
  read: notification.read,
  created_at: notification.created_at.toISOString(),
});

// GET /api/notifications
export const getMyNotifications = async (req: Request, res: Response) => {
  const notifications = await notificationModel.getNotificationsForRecipient(
    sessionUserId(req),
  );
  res.status(200).json(notifications.map(toPublicNotification));
};

// POST /api/notifications/:notificationId/read
export const markNotificationRead = async (req: Request, res: Response) => {
  const notificationId = parseObjectId(req.params.notificationId);

  if (!notificationId) {
    return res.status(400).json({ error: "Invalid notification id." });
  }

  const notification = await notificationModel.getNotificationById(
    notificationId,
  );

  if (
    !notification ||
    !notification.recipient_id.equals(sessionUserId(req))
  ) {
    return res.status(404).json({ error: "Cannot find notification." });
  }

  await notificationModel.markRead(notificationId);
  res.status(204).send();
};

// POST /api/notifications/read-all
export const markAllNotificationsRead = async (req: Request, res: Response) => {
  await notificationModel.markAllReadForRecipient(sessionUserId(req));
  res.status(204).send();
};
