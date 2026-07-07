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

  addUser: async (user: Omit<User, "_id">): Promise<void> => {
    await usersCollection.insertOne({
      name: user.name,
      email: user.email,
      password_hash: user.password_hash,
      role: user.role,
    });
  },

  init: async (): Promise<void> => {
    try {
      await client.connect();
      db = client.db();
      usersCollection = db.collection("users");

      // TODO: Replace with a unique index on username/email once that field exists for login.
      await usersCollection.createIndex({ id: 1 });
    } catch (e: unknown) {
      throw new Error(
        e instanceof Error ? e.message : "MongoDB initialization failed.",
      );
    }
  },
};

export { helpers };
