import { ClientSession, Collection, ObjectId } from "mongodb";
import { getDb } from "../config/database";

/**
 * A trainer↔client connection request. Either side can initiate
 * (`requested_by`), and the other side must accept before the link is
 * written to `clients.trainer_id` (see linkService.respondToRequest).
 */

export type LinkRequestStatus = "pending" | "accepted" | "declined";
export type LinkRequestInitiator = "trainer" | "client";

export interface LinkRequest {
  _id?: ObjectId;
  trainer_id: ObjectId;
  client_id: ObjectId;
  requested_by: LinkRequestInitiator;
  status: LinkRequestStatus;
  created_at: Date;
  responded_at?: Date;
}

export const collection = (): Collection<LinkRequest> =>
  getDb().collection("link_requests");

export const init = async (): Promise<void> => {
  // At most one pending request per trainer/client pair, enforced by the
  // database so the duplicate check doesn't depend only on service logic.
  await collection().createIndex(
    { trainer_id: 1, client_id: 1 },
    { unique: true, partialFilterExpression: { status: "pending" } },
  );
  await collection().createIndex({ client_id: 1, status: 1 });
};

export const addLinkRequest = async (
  request: Omit<LinkRequest, "_id">,
): Promise<ObjectId> => {
  const result = await collection().insertOne(request);
  return result.insertedId;
};

export const getLinkRequestById = async (
  requestId: ObjectId,
): Promise<LinkRequest | null> => {
  return await collection().findOne({ _id: requestId });
};

// True when a pending request already exists between this exact pair,
// regardless of which side initiated it.
export const hasPendingBetween = async (
  trainerId: ObjectId,
  clientId: ObjectId,
): Promise<boolean> => {
  return (
    (await collection().countDocuments(
      { trainer_id: trainerId, client_id: clientId, status: "pending" },
      { limit: 1 },
    )) === 1
  );
};

export const setStatus = async (
  requestId: ObjectId,
  status: LinkRequestStatus,
  respondedAt: Date,
  session?: ClientSession,
): Promise<void> => {
  await collection().updateOne(
    { _id: requestId },
    { $set: { status, responded_at: respondedAt } },
    session ? { session } : {},
  );
};

/**
 * Declines every other pending request involving this client. Called when
 * a request is accepted: the client now has their one trainer, so any
 * other pending request (from any trainer, in either direction) is moot.
 */
export const declineOtherPendingForClient = async (
  clientId: ObjectId,
  exceptRequestId: ObjectId,
  respondedAt: Date,
  session?: ClientSession,
): Promise<void> => {
  await collection().updateMany(
    { client_id: clientId, status: "pending", _id: { $ne: exceptRequestId } },
    { $set: { status: "declined", responded_at: respondedAt } },
    session ? { session } : {},
  );
};
