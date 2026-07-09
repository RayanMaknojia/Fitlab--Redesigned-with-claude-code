import { Collection, ObjectId } from "mongodb";
import { getDb } from "../config/database";

export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  password_hash: string;
  role: "client" | "trainer";
}

export interface NewUserInput {
  name: string;
  email: string;
  password: string;
  role: "client" | "trainer";
}

const collection = (): Collection<User> => getDb().collection("users");

const init = async (): Promise<void> => {
  // enforce uniqueness at the database so duplicate checks do not depend only on controller logic.
  await collection().createIndex({ email: 1 }, { unique: true });
};

const getAllUsers = async (): Promise<User[]> => {
  return await collection().find({}).toArray();
};

const findUserByEmail = async (email: string): Promise<User | null> => {
  return await collection().findOne({ email });
};

const addUser = async (user: Omit<User, "_id">): Promise<void> => {
  const document: Omit<User, "_id"> = {
    name: user.name,
    email: user.email,
    password_hash: user.password_hash,
    role: user.role,
  };

  await collection().insertOne(document);
};

export { init, getAllUsers, findUserByEmail, addUser };
