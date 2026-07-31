import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getClient } from "../config/database";
import * as userModel from "../models/User";
import * as listingModel from "../models/Listing";
import { parseObjectId } from "../utils/parseObjectId";

const sessionUserId = (req: Request): ObjectId =>
  new ObjectId(req.session.user!.id);

// PATCH /api/admin/users/:userId/block
export const blockUser = async (req: Request, res: Response) => {
  const userId = parseObjectId(req.params.userId);

  if (!userId) {
    return res.status(400).json({ error: "Invalid user id." });
  }

  if (userId.equals(sessionUserId(req))) {
    return res.status(400).json({ error: "You cannot block your own account." });
  }

  const target = await userModel.findUserById(userId);

  if (!target) {
    return res.status(404).json({ error: "Cannot find user." });
  }

  if (target.role === "admin") {
    return res.status(400).json({ error: "Cannot block another admin." });
  }

  const session = getClient().startSession();

  try {
    await session.withTransaction(async () => {
      await userModel.setUserBlocked(userId, true);
      await listingModel.markRemovedForUser(
        userId,
        sessionUserId(req),
        "Account blocked by admin.",
        session,
      );
    });
  } finally {
    await session.endSession();
  }

  res.status(204).send();
};

// PATCH /api/admin/users/:userId/unblock
export const unblockUser = async (req: Request, res: Response) => {
  const userId = parseObjectId(req.params.userId);

  if (!userId) {
    return res.status(400).json({ error: "Invalid user id." });
  }

  const target = await userModel.findUserById(userId);

  if (!target) {
    return res.status(404).json({ error: "Cannot find user." });
  }

  await userModel.setUserBlocked(userId, false);
  res.status(204).send();
};

const toPublicListing = (listing: listingModel.Listing) => ({
  listing_id: listing._id!.toString(),
  user_id: listing.user_id.toString(),
  role: listing.role,
  name: listing.name,
  headline: listing.headline,
  bio: listing.bio,
  status: listing.status,
  removed_reason: listing.removed_reason ?? null,
  created_at: listing.created_at.toISOString(),
  updated_at: listing.updated_at.toISOString(),
});

// GET /api/admin/listings
export const getAllListings = async (_req: Request, res: Response) => {
  const listings = await listingModel.getAllListingsForAdmin();
  res.status(200).json(listings.map(toPublicListing));
};

// POST /api/admin/listings/:listingId/remove
export const removeListing = async (req: Request, res: Response) => {
  const listingId = parseObjectId(req.params.listingId);

  if (!listingId) {
    return res.status(400).json({ error: "Invalid listing id." });
  }

  const { reason } = req.body ?? {};
  const cleanReason =
    typeof reason === "string" && reason.trim() ? reason.trim() : undefined;

  const removed = await listingModel.markRemoved(
    listingId,
    sessionUserId(req),
    cleanReason,
  );

  if (!removed) {
    return res.status(404).json({ error: "Cannot find listing." });
  }

  res.status(204).send();
};
