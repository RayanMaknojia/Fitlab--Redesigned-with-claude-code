import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import * as z from "zod";
import * as listingModel from "../models/Listing";
import * as linkService from "../services/linkService";
import { parseObjectId } from "../utils/parseObjectId";


// Clients and trainers post a listing (headline + bio) advertising themselves
// Browse the opposite role's listings, and send a connection request straight from a listing.
 // ConnectToListing wraps linkService.createRequest avoiding having to publicly disclose email.

const sessionUserId = (req: Request): ObjectId =>
  new ObjectId(req.session.user!.id);

// Admins aren't making listings
const sessionRole = (req: Request): "client" | "trainer" | null => {
  const role = req.session.user!.role;
  return role === "client" || role === "trainer" ? role : null;
};

const oppositeRole = (role: "client" | "trainer") =>
  role === "client" ? "trainer" : "client";

const toPublicListing = (listing: listingModel.Listing) => ({
  listing_id: listing._id!.toString(),
  user_id: listing.user_id.toString(),
  role: listing.role,
  name: listing.name,
  headline: listing.headline,
  bio: listing.bio,
  created_at: listing.created_at.toISOString(),
  updated_at: listing.updated_at.toISOString(),
});

const ListingInput = z.object({
  headline: z.string().trim().min(1).max(120),
  bio: z.string().trim().min(1).max(2000),
});

// PUT /api/me/listing  { headline, bio }
export const upsertMyListing = async (req: Request, res: Response) => {
  const role = sessionRole(req);

  if (!role) {
    return res
      .status(403)
      .json({ error: "Only clients and trainers can post a listing." });
  }

  const result = ListingInput.safeParse(req.body);

  if (!result.success) {
    return res
      .status(400)
      .json({ error: "A headline and bio are required." });
  }

  const userId = sessionUserId(req);
  await listingModel.upsertListing(
    userId,
    role,
    req.session.user!.name,
    result.data.headline,
    result.data.bio,
  );

  const listing = await listingModel.getListingByUserId(userId);
  res.status(200).json(toPublicListing(listing!));
};

// GET /api/me/listing
export const getMyListing = async (req: Request, res: Response) => {
  const listing = await listingModel.getListingByUserId(sessionUserId(req));
  res.status(200).json({ listing: listing ? toPublicListing(listing) : null });
};

// DELETE /api/me/listing
export const deleteMyListing = async (req: Request, res: Response) => {
  await listingModel.deleteListingByUserId(sessionUserId(req));
  res.status(204).send();
};

// GET /api/listings/browse
export const browseListings = async (req: Request, res: Response) => {
  const role = sessionRole(req);

  if (!role) {
    return res
      .status(403)
      .json({ error: "Only clients and trainers can browse listings." });
  }

  const listings = await listingModel.getActiveListingsByRole(
    oppositeRole(role),
  );
  res.status(200).json(listings.map(toPublicListing));
};

// GET /api/listings/:listingId
export const getListing = async (req: Request, res: Response) => {
  const listingId = parseObjectId(req.params.listingId);

  if (!listingId) {
    return res.status(400).json({ error: "Invalid listing id." });
  }

  const listing = await listingModel.getListingById(listingId);

  if (!listing || listing.status !== "active") {
    return res.status(404).json({ error: "Cannot find listing." });
  }

  res.status(200).json(toPublicListing(listing));
};

// POST /api/listings/:listingId/connect
export const connectToListing = async (req: Request, res: Response) => {
  const role = sessionRole(req);

  if (!role) {
    return res
      .status(403)
      .json({ error: "Only clients and trainers can send connection requests." });
  }

  const listingId = parseObjectId(req.params.listingId);

  if (!listingId) {
    return res.status(400).json({ error: "Invalid listing id." });
  }

  const listing = await listingModel.getListingById(listingId);

  if (!listing || listing.status !== "active") {
    return res.status(404).json({ error: "Cannot find listing." });
  }

  if (listing.role === role) {
    return res
      .status(400)
      .json({ error: "Cannot send a connection request to your own role." });
  }

  const trainerId = role === "trainer" ? sessionUserId(req) : listing.user_id;
  const clientId = role === "client" ? sessionUserId(req) : listing.user_id;

  try {
    const view = await linkService.createRequest(trainerId, clientId, role);
    res.status(201).json(view);
  } catch (e) {
    if (e instanceof linkService.EmailNotFoundError) {
      return res.status(404).json({ error: e.message });
    }
    if (
      e instanceof linkService.AlreadyLinkedError ||
      e instanceof linkService.ClientHasTrainerError ||
      e instanceof linkService.DuplicatePendingRequestError
    ) {
      return res.status(409).json({ error: e.message });
    }
    throw e;
  }
};
