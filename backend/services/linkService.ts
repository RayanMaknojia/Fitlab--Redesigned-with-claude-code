import { ObjectId } from "mongodb";
import { MongoServerError } from "mongodb";
import { getClient } from "../config/database";
import * as userModel from "../models/User";
import * as clientModel from "../models/Client";
import * as linkRequestModel from "../models/LinkRequest";
import type { LinkRequest } from "../models/LinkRequest";
import * as notificationModel from "../models/Notification";

/**
 * LinkService
 *
 * The trainer↔client linking flow that everything trainer-side hangs off:
 * getClientsByTrainerId, DataSyncupService and ScheduleService all gate on
 * `clients.trainer_id`, and this service is the only thing that writes it.
 *
 * - Either side sends a request by the OTHER side's email. The email must
 *   exist and belong to the right role (specific error for each case).
 * - The other side accepts or declines. Accepting writes `trainer_id`
 *   atomically (a client has at most one trainer) and auto-declines every
 *   other pending request involving that client, in one transaction.
 * - Either side can unlink; unlinking frees the client to link again.
 */

// --- errors (controller maps each to a status code + message) ---

export class EmailNotFoundError extends Error {
  constructor() {
    super("No FitLab account found with that email.");
  }
}

export class NotAClientEmailError extends Error {
  constructor() {
    super("This email does not belong to a client's account.");
  }
}

export class NotATrainerEmailError extends Error {
  constructor() {
    super("This email does not belong to a trainer's account.");
  }
}

export class AlreadyLinkedError extends Error {
  constructor() {
    super("You are already linked with this user.");
  }
}

export class ClientHasTrainerError extends Error {
  constructor() {
    super(
      "This client is already linked with a trainer. A client can only have one trainer at a time.",
    );
  }
}

export class DuplicatePendingRequestError extends Error {
  constructor() {
    super("A link request between you two is already pending.");
  }
}

export class RequestNotFoundError extends Error {
  constructor() {
    super("Cannot find a pending link request with that id.");
  }
}

export class RequestAccessError extends Error {
  constructor() {
    super("You are not allowed to respond to this link request.");
  }
}

export class NotLinkedError extends Error {
  constructor() {
    super("No active link found to remove.");
  }
}

// --- views ---

export interface LinkRequestView {
  request_id: string;
  trainer_id: string;
  trainer_name: string;
  trainer_email: string;
  client_id: string;
  client_name: string;
  client_email: string;
  requested_by: "trainer" | "client";
  status: "pending" | "accepted" | "declined";
  created_at: string;
  responded_at: string | null;
}

export interface LinkedTrainerView {
  trainer_id: string;
  name: string;
  email: string;
}

// Joins both users onto requests so one view shape serves both sides.
const viewPipeline = (match: Record<string, unknown>) => [
  { $match: match },
  {
    $lookup: {
      from: "users",
      localField: "trainer_id",
      foreignField: "_id",
      as: "trainer",
    },
  },
  { $unwind: "$trainer" },
  {
    $lookup: {
      from: "users",
      localField: "client_id",
      foreignField: "_id",
      as: "client",
    },
  },
  { $unwind: "$client" },
  { $sort: { created_at: -1 as const } },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toView = (row: any): LinkRequestView => ({
  request_id: row._id.toString(),
  trainer_id: row.trainer_id.toString(),
  trainer_name: row.trainer.name,
  trainer_email: row.trainer.email,
  client_id: row.client_id.toString(),
  client_name: row.client.name,
  client_email: row.client.email,
  requested_by: row.requested_by,
  status: row.status,
  created_at: new Date(row.created_at).toISOString(),
  responded_at: row.responded_at
    ? new Date(row.responded_at).toISOString()
    : null,
});

const getRequestViewById = async (
  requestId: ObjectId,
): Promise<LinkRequestView> => {
  const rows = await linkRequestModel
    .collection()
    .aggregate(viewPipeline({ _id: requestId }))
    .toArray();

  if (rows.length === 0) {
    throw new RequestNotFoundError();
  }

  return toView(rows[0]);
};

// --- notifications ---

// Who should be notified when a request is created, and what it should say.
const newRequestNotification = (view: LinkRequestView) => {
  const initiatedByTrainer = view.requested_by === "trainer";
  return {
    recipientId: new ObjectId(initiatedByTrainer ? view.client_id : view.trainer_id),
    message: `${initiatedByTrainer ? view.trainer_name : view.client_name} sent you a connection request.`,
  };
};

// Who should be notified when a request is accepted/declined, and what it
// should say. Always the side that sent the original request.
const respondedNotification = (view: LinkRequestView) => {
  const initiatedByTrainer = view.requested_by === "trainer";
  const responderName = initiatedByTrainer ? view.client_name : view.trainer_name;
  const verb = view.status === "accepted" ? "accepted" : "declined";
  return {
    recipientId: new ObjectId(initiatedByTrainer ? view.trainer_id : view.client_id),
    type: (view.status === "accepted"
      ? "link_request_accepted"
      : "link_request_declined") as notificationModel.NotificationType,
    message: `${responderName} ${verb} your connection request.`,
  };
};

// --- sending requests ---

// Shared guts of both send directions: validates the pair can link and
// inserts the pending request. The unique partial index backstops the
// duplicate check against concurrent sends.
// Exported for the marketplace's id-based Connect flow.
export const createRequest = async (
  trainerId: ObjectId,
  clientId: ObjectId,
  requestedBy: "trainer" | "client",
): Promise<LinkRequestView> => {
  const client = await clientModel.getClientById(clientId);

  if (!client) {
    // Registration always creates the client shell; a missing one means
    // the account is in a broken state — treat as not found.
    throw new EmailNotFoundError();
  }

  if (client.trainer_id) {
    if (client.trainer_id.equals(trainerId)) {
      throw new AlreadyLinkedError();
    }
    throw new ClientHasTrainerError();
  }

  if (await linkRequestModel.hasPendingBetween(trainerId, clientId)) {
    throw new DuplicatePendingRequestError();
  }

  const request: Omit<LinkRequest, "_id"> = {
    trainer_id: trainerId,
    client_id: clientId,
    requested_by: requestedBy,
    status: "pending",
    created_at: new Date(),
  };

  try {
    const id = await linkRequestModel.addLinkRequest(request);
    const view = await getRequestViewById(id);

    const { recipientId, message } = newRequestNotification(view);
    await notificationModel.addNotification({
      recipient_id: recipientId,
      type: "link_request_received",
      link_request_id: id,
      message,
      read: false,
      created_at: new Date(),
    });

    return view;
  } catch (e) {
    // Two identical requests raced past the check; the unique index wins.
    if (e instanceof MongoServerError && e.code === 11000) {
      throw new DuplicatePendingRequestError();
    }
    throw e;
  }
};

/** Trainer sends a link request to a client, looked up by email. */
export const sendRequestToClient = async (
  trainerId: ObjectId,
  clientEmail: string,
): Promise<LinkRequestView> => {
  const email = clientEmail.trim().toLowerCase();
  const clientUser = await userModel.findClientByEmail(email);

  if (!clientUser) {
    if (await userModel.emailExists(email)) {
      throw new NotAClientEmailError();
    }
    throw new EmailNotFoundError();
  }

  return await createRequest(trainerId, clientUser._id!, "trainer");
};

/** Client sends a link request to a trainer, looked up by email. */
export const sendRequestToTrainer = async (
  clientId: ObjectId,
  trainerEmail: string,
): Promise<LinkRequestView> => {
  const email = trainerEmail.trim().toLowerCase();
  const trainerUser = await userModel.findTrainerByEmail(email);

  if (!trainerUser) {
    if (await userModel.emailExists(email)) {
      throw new NotATrainerEmailError();
    }
    throw new EmailNotFoundError();
  }

  return await createRequest(trainerUser._id!, clientId, "client");
};

// --- listing ---

/** All pending requests involving this trainer (both directions). */
export const getPendingRequestsForTrainer = async (
  trainerId: ObjectId,
): Promise<LinkRequestView[]> => {
  const rows = await linkRequestModel
    .collection()
    .aggregate(viewPipeline({ trainer_id: trainerId, status: "pending" }))
    .toArray();
  return rows.map(toView);
};

/** All pending requests involving this client (both directions). */
export const getPendingRequestsForClient = async (
  clientId: ObjectId,
): Promise<LinkRequestView[]> => {
  const rows = await linkRequestModel
    .collection()
    .aggregate(viewPipeline({ client_id: clientId, status: "pending" }))
    .toArray();
  return rows.map(toView);
};

// --- responding ---

/**
 * The receiving side accepts or declines a pending request. Only the side
 * that did NOT initiate may respond. Accepting links the pair (atomic —
 * fails if the client got a trainer in the meantime) and auto-declines the
 * client's other pending requests, all in one transaction.
 */
export const respondToRequest = async (
  responderId: ObjectId,
  requestId: ObjectId,
  accept: boolean,
): Promise<LinkRequestView> => {
  const request = await linkRequestModel.getLinkRequestById(requestId);

  if (!request || request.status !== "pending") {
    throw new RequestNotFoundError();
  }

  const expectedResponderId =
    request.requested_by === "trainer" ? request.client_id : request.trainer_id;

  if (!expectedResponderId.equals(responderId)) {
    throw new RequestAccessError();
  }

  const respondedAt = new Date();

  if (!accept) {
    await linkRequestModel.setStatus(requestId, "declined", respondedAt);
    const view = await getRequestViewById(requestId);
    const { recipientId, type, message } = respondedNotification(view);
    await notificationModel.addNotification({
      recipient_id: recipientId,
      type,
      link_request_id: requestId,
      message,
      read: false,
      created_at: new Date(),
    });
    return view;
  }

  const session = getClient().startSession();

  try {
    await session.withTransaction(async () => {
      const linked = await clientModel.setTrainerIfUnset(
        request.client_id,
        request.trainer_id,
        session,
      );

      if (!linked) {
        // The client linked with another trainer since this request was
        // sent — the request can never succeed, so close it out.
        throw new ClientHasTrainerError();
      }

      await linkRequestModel.setStatus(
        requestId,
        "accepted",
        respondedAt,
        session,
      );
      await linkRequestModel.declineOtherPendingForClient(
        request.client_id,
        requestId,
        respondedAt,
        session,
      );
    });
  } catch (e) {
    if (e instanceof ClientHasTrainerError) {
      await linkRequestModel.setStatus(requestId, "declined", respondedAt);
    }
    throw e;
  } finally {
    await session.endSession();
  }

  const view = await getRequestViewById(requestId);
  const { recipientId, type, message } = respondedNotification(view);
  await notificationModel.addNotification({
    recipient_id: recipientId,
    type,
    link_request_id: requestId,
    message,
    read: false,
    created_at: new Date(),
  });
  return view;
};

// --- unlinking ---

/** Trainer removes their link with one of their clients. */
export const unlinkClientFromTrainer = async (
  trainerId: ObjectId,
  clientId: ObjectId,
): Promise<void> => {
  const removed = await clientModel.unsetTrainer(clientId, trainerId);
  if (!removed) {
    throw new NotLinkedError();
  }
};

/** Client removes their link with their trainer (whoever it is). */
export const unlinkTrainerFromClient = async (
  clientId: ObjectId,
): Promise<void> => {
  const removed = await clientModel.unsetTrainer(clientId);
  if (!removed) {
    throw new NotLinkedError();
  }
};

/** The client's linked trainer, or null — drives the client-side UI state. */
export const getLinkedTrainer = async (
  clientId: ObjectId,
): Promise<LinkedTrainerView | null> => {
  const client = await clientModel.getClientById(clientId);

  if (!client?.trainer_id) {
    return null;
  }

  const trainer = await userModel.findUserById(client.trainer_id);

  if (!trainer) {
    return null;
  }

  return {
    trainer_id: client.trainer_id.toString(),
    name: trainer.name,
    email: trainer.email,
  };
};
