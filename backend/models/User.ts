import { Collection, ObjectId } from "mongodb";
import { getDb, getClient } from "../config/database";
import * as clientModel from "./Client";

export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  password_hash: string;
  role: "client" | "trainer" | "admin";
}

export interface NewUserInput {
  name: string;
  email: string;
  password: string;
  role: "client" | "trainer" | "admin";
}

const collection = (): Collection<User> => getDb().collection("users");

const init = async (): Promise<void> => {
  // enforce uniqueness at the database so duplicate checks do not depend only on controller logic.
  await collection().createIndex({ email: 1 }, { unique: true });
};

const getAllUsers = async (): Promise<User[]> => {
  return await collection()
    .find({}, { projection: { password_hash: 0 } })
    .toArray();
};

const findUserByEmail = async (email: string): Promise<User | null> => {
  return await collection().findOne({ email });
};

// Role-scoped lookups for the linking flow. In our design language "user"
// covers every role; these return only the specific role asked for, and
// never include the password hash (they're for cross-user lookups, unlike
// findUserByEmail which login uses to verify a password).
const findClientByEmail = async (
  email: string,
): Promise<Omit<User, "password_hash"> | null> => {
  return await collection().findOne(
    { email, role: "client" },
    { projection: { password_hash: 0 } },
  );
};

const findTrainerByEmail = async (
  email: string,
): Promise<Omit<User, "password_hash"> | null> => {
  return await collection().findOne(
    { email, role: "trainer" },
    { projection: { password_hash: 0 } },
  );
};

// Existence check without pulling the document (so callers can distinguish
// "email not registered" from "email belongs to the wrong role" without
// ever touching the password hash).
const emailExists = async (email: string): Promise<boolean> => {
  return (await collection().countDocuments({ email }, { limit: 1 })) === 1;
};

const findUserById = async (
  userId: ObjectId,
): Promise<Omit<User, "password_hash"> | null> => {
  return await collection().findOne(
    { _id: userId },
    { projection: { password_hash: 0 } },
  );
};

const userExists = async (userId: ObjectId): Promise<boolean> => {
  return (await collection().countDocuments({ _id: userId }, { limit: 1 })) === 1;
};

const updatePasswordHash = async (
  userId: ObjectId,
  password_hash: string,
): Promise<void> => {
  await collection().updateOne({ _id: userId }, { $set: { password_hash } });
};

// Registering a client also creates a shell record in clients, in the same
// transaction so a crash can't leave one without the other. Requires mongod
// replication enabled (replSetName set in mongod.cfg).
const addUser = async (user: Omit<User, "_id">): Promise<void> => {
  const document: Omit<User, "_id"> = {
    name: user.name,
    email: user.email,
    password_hash: user.password_hash,
    role: user.role,
  };

  const session = getClient().startSession();

  try {
    await session.withTransaction(async () => {
      const result = await collection().insertOne(document, { session });

      if (user.role === "client") {
        await clientModel.addClient({ _id: result.insertedId }, session);
      }
    });
  } finally {
    await session.endSession();
  }
};
export {
  init,
  getAllUsers,
  findUserByEmail,
  findClientByEmail,
  findTrainerByEmail,
  emailExists,
  findUserById,
  userExists,
  addUser,
  updatePasswordHash,
};

