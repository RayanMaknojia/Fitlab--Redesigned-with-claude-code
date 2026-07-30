import express from "express";
import {
  upsertMyListing,
  getMyListing,
  deleteMyListing,
  browseListings,
  getListing,
  connectToListing,
} from "../controllers/listingController";
import { requireAuth } from "../middleware/requireAuth";

export const listingRouter = express.Router();

listingRouter.use(requireAuth);

/**
 * @swagger
 * /api/me/listing:
 *   put:
 *     summary: Create or update the logged-in user's own listing
 *     tags: [Listings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - headline
 *               - bio
 *             properties:
 *               headline:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: The created or updated listing
 *       400:
 *         description: Missing or invalid headline/bio
 *       403:
 *         description: Logged-in user is not a client or trainer
 */
listingRouter.put("/me/listing", upsertMyListing);

/**
 * @swagger
 * /api/me/listing:
 *   get:
 *     summary: Get the logged-in user's own listing
 *     tags: [Listings]
 *     responses:
 *       200:
 *         description: "{ listing } with the caller's listing, or { listing: null }"
 */
listingRouter.get("/me/listing", getMyListing);

/**
 * @swagger
 * /api/me/listing:
 *   delete:
 *     summary: Delete the logged-in user's own listing
 *     tags: [Listings]
 *     responses:
 *       204:
 *         description: Listing deleted (a no-op if none existed)
 */
listingRouter.delete("/me/listing", deleteMyListing);

/**
 * @swagger
 * /api/listings/browse:
 *   get:
 *     summary: Browse active listings of the opposite role from the caller
 *     tags: [Listings]
 *     responses:
 *       200:
 *         description: Active listings, newest first
 *       403:
 *         description: Logged-in user is not a client or trainer
 */
listingRouter.get("/listings/browse", browseListings);

/**
 * @swagger
 * /api/listings/{listingId}:
 *   get:
 *     summary: Get one listing in full
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The listing
 *       400:
 *         description: Listing id is invalid
 *       404:
 *         description: Cannot find listing
 */
listingRouter.get("/listings/:listingId", getListing);

/**
 * @swagger
 * /api/listings/{listingId}/connect:
 *   post:
 *     summary: Send a connection request to the owner of this listing
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Pending link request created and returned
 *       400:
 *         description: Listing id is invalid, or it belongs to the caller's own role
 *       403:
 *         description: Logged-in user is not a client or trainer
 *       404:
 *         description: Cannot find listing
 *       409:
 *         description: Already linked, or a request is already pending
 */
listingRouter.post("/listings/:listingId/connect", connectToListing);
