import express from "express";
import {
  blockUser,
  unblockUser,
  getAllListings,
  removeListing,
} from "../controllers/adminController";
import { requireAuth } from "../middleware/requireAuth";
import { requireAdmin } from "../middleware/requireAdmin";

export const adminRouter = express.Router();

adminRouter.use(requireAuth, requireAdmin);

/**
 * @swagger
 * /api/admin/users/{userId}/block:
 *   patch:
 *     summary: Block a user's account
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: User blocked, and their listing (if any) removed
 *       400:
 *         description: User id is invalid, or the target is the caller's own account or another admin
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Logged-in user is not an admin
 *       404:
 *         description: Cannot find user
 */
adminRouter.patch("/users/:userId/block", blockUser);

/**
 * @swagger
 * /api/admin/users/{userId}/unblock:
 *   patch:
 *     summary: Unblock a user's account
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: User unblocked
 *       400:
 *         description: User id is invalid
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Logged-in user is not an admin
 *       404:
 *         description: Cannot find user
 */
adminRouter.patch("/users/:userId/unblock", unblockUser);

/**
 * @swagger
 * /api/admin/listings:
 *   get:
 *     summary: Every listing, any role or status
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: All listings, newest first
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Logged-in user is not an admin
 */
adminRouter.get("/listings", getAllListings);

/**
 * @swagger
 * /api/admin/listings/{listingId}/remove:
 *   post:
 *     summary: Remove a listing
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       204:
 *         description: Listing removed
 *       400:
 *         description: Listing id is invalid
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Logged-in user is not an admin
 *       404:
 *         description: Cannot find listing
 */
adminRouter.post("/listings/:listingId/remove", removeListing);
