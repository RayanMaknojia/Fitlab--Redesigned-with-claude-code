import { ObjectId } from "mongodb";
import * as clientModel from "../models/Client";
import type { SessionUser } from "../types";

export const canAccessClient = async (
  user: SessionUser,
  clientId: ObjectId,
): Promise<boolean> => {
  if (user.id === clientId.toString()) {
    return true;
  }

  if (user.role !== "trainer") {
    return false;
  }

  const client = await clientModel.getClient(clientId);
  return client?.trainer_id?.toString() === user.id;
};
