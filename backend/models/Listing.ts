import { ClientSession, Collection, ObjectId } from "mongodb";
import { getDb } from "../config/database";

export type ListingRole = "client" | "trainer";
export type ListingStatus = "active" | "removed";

export interface Listing {
  _id?: ObjectId;
  user_id: ObjectId;
  role: ListingRole;
  // Denormalized from the user at write time.
  name: string;
  headline: string;
  bio: string;
  // "removed" is set by admin moderation.
  status: ListingStatus;
  removed_by?: ObjectId;
  removed_reason?: string;
  created_at: Date;
  updated_at: Date;
}

export const collection = (): Collection<Listing> =>
  getDb().collection("listings");

export const init = async (): Promise<void> => {
  // One listing per user.
  await collection().createIndex({ user_id: 1 }, { unique: true });
  await collection().createIndex({ role: 1, status: 1 });
};

export const getListingByUserId = async (
  userId: ObjectId,
): Promise<Listing | null> => {
  return await collection().findOne({ user_id: userId });
};

export const getListingById = async (
  listingId: ObjectId,
): Promise<Listing | null> => {
  return await collection().findOne({ _id: listingId });
};

/** Active listings of the given role, newest first. */
export const getActiveListingsByRole = async (
  role: ListingRole,
): Promise<Listing[]> => {
  return await collection()
    .find({ role, status: "active" })
    .sort({ created_at: -1 })
    .toArray();
};

/** Create-or-update the caller's own listing (one per user). */
export const upsertListing = async (
  userId: ObjectId,
  role: ListingRole,
  name: string,
  headline: string,
  bio: string,
): Promise<void> => {
  const now = new Date();
  await collection().updateOne(
    { user_id: userId },
    {
      $set: { role, name, headline, bio, status: "active", updated_at: now },
      $setOnInsert: { user_id: userId, created_at: now },
    },
    { upsert: true },
  );
};

export const deleteListingByUserId = async (
  userId: ObjectId,
  session?: ClientSession,
): Promise<boolean> => {
  const result = await collection().deleteOne(
    { user_id: userId },
    session ? { session } : {},
  );
  return result.deletedCount === 1;
};

/** Every listing, any role/status, newest first. For admin moderation. */
export const getAllListingsForAdmin = async (): Promise<Listing[]> => {
  return await collection().find({}).sort({ created_at: -1 }).toArray();
};

const removedFields = (removedBy: ObjectId, reason: string | undefined) => ({
  status: "removed" as const,
  removed_by: removedBy,
  ...(reason ? { removed_reason: reason } : {}),
  updated_at: new Date(),
});

export const markRemoved = async (
  listingId: ObjectId,
  removedBy: ObjectId,
  reason: string | undefined,
  session?: ClientSession,
): Promise<boolean> => {
  const result = await collection().updateOne(
    { _id: listingId },
    { $set: removedFields(removedBy, reason) },
    session ? { session } : {},
  );
  return result.matchedCount === 1;
};

export const markRemovedForUser = async (
  userId: ObjectId,
  removedBy: ObjectId,
  reason: string | undefined,
  session?: ClientSession,
): Promise<boolean> => {
  const result = await collection().updateOne(
    { user_id: userId },
    { $set: removedFields(removedBy, reason) },
    session ? { session } : {},
  );
  return result.matchedCount === 1;
};
