import { Collection, ObjectId } from "mongodb";
import { getDb } from "../config/database";

export interface PasswordResetToken {
  _id?: ObjectId;
  user_id: ObjectId;
  token_hash: string;
  expires_at: Date;
}

export const collection = (): Collection<PasswordResetToken> =>
  getDb().collection("password_reset_tokens");

export const init = async (): Promise<void> => {
  await collection().createIndex({ token_hash: 1 });
  // TTL index: MongoDB deletes each document once its expires_at is reached.
  await collection().createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });
};

export const createToken = async (
  user_id: ObjectId,
  token_hash: string,
  expires_at: Date,
): Promise<void> => {
  await collection().insertOne({ user_id, token_hash, expires_at });
};

export const findValidByTokenHash = async (
  token_hash: string,
): Promise<PasswordResetToken | null> => {
  return await collection().findOne({
    token_hash,
    expires_at: { $gt: new Date() },
  });
};

export const deleteAllForUser = async (user_id: ObjectId): Promise<void> => {
  await collection().deleteMany({ user_id });
};
