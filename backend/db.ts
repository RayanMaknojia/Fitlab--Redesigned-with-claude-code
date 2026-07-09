import { Db, MongoClient, Collection } from "mongodb";
import { loadEnvFile } from "process";
import { User } from "./types";

loadEnvFile();

const CONNECTION_STRING = process.env.CONNECTION_STRING;

if (!CONNECTION_STRING) {
  throw new Error("CONNECTION_STRING is not set.");
}

const client = new MongoClient(CONNECTION_STRING);

let db: Db;
let usersCollection: Collection<User>;

const helpers = {
  getAllUsers: async (): Promise<User[]> => {
    return await usersCollection.find({}).toArray();
  },

  findUserByEmail: async (email: string): Promise<User | null> => {
    // Check email before inserting a new account.
    return await usersCollection.findOne({ email });
  },

  addUser: async (user: Omit<User, "_id">): Promise<void> => {
    const document: Omit<User, "_id"> = {
      name: user.name,
      email: user.email,
      password_hash: user.password_hash,
      role: user.role,
    };

    await usersCollection.insertOne(document);
  },

  init: async (): Promise<void> => {
    try {
      await client.connect();
      db = client.db();
      usersCollection = db.collection("users");

      // enforce uniqueness at the database so duplicate checks do not depend only on controller logic.
      await usersCollection.createIndex({ email: 1 }, { unique: true });
    } catch (e: unknown) {
      throw new Error(
        e instanceof Error ? e.message : "MongoDB initialization failed.",
      );
    }
  },
};

export { helpers };
