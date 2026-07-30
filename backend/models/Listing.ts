import { Collection, ObjectId } from "mongodb";
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
  // "removed" is set by admin moderation #TODO not built yet.
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
): Promise<boolean> => {
  const result = await collection().deleteOne({ user_id: userId });
  return result.deletedCount === 1;
};
