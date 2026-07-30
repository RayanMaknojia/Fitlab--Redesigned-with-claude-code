import express from "express";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notificationController";
import { requireAuth } from "../middleware/requireAuth";

export const notificationRouter = express.Router();

notificationRouter.use(requireAuth);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: The logged-in user's notifications, newest first
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Notifications for the caller
 */
notificationRouter.get("/notifications", getMyNotifications);

/**
 * @swagger
 * /api/notifications/{notificationId}/read:
 *   post:
 *     summary: Mark one notification read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Marked read
 *       400:
 *         description: Notification id is invalid
 *       404:
 *         description: Cannot find notification
 */
notificationRouter.post("/notifications/:notificationId/read", markNotificationRead);

/**
 * @swagger
 * /api/notifications/read-all:
 *   post:
 *     summary: Mark all of the logged-in user's notifications read
 *     tags: [Notifications]
 *     responses:
 *       204:
 *         description: Marked read
 */
notificationRouter.post("/notifications/read-all", markAllNotificationsRead);
