import { Db, MongoClient } from "mongodb";
import { loadEnvFile } from "process";

loadEnvFile();

// Under Jest, @shelf/jest-mongodb's environment injects an isolated
// in-memory Mongo instance via this global. Prefer it so tests never
// touch the real dev database.
const MONGO_TEST_URI = (globalThis as { __MONGO_URI__?: string }).__MONGO_URI__;
const CONNECTION_STRING = MONGO_TEST_URI ?? process.env.CONNECTION_STRING;

if (!CONNECTION_STRING) {
  throw new Error("CONNECTION_STRING is not set.");
}

const client = new MongoClient(CONNECTION_STRING);

let db: Db;

const connect = async (): Promise<void> => {
  try {
    await client.connect();
    db = client.db();
  } catch (e: unknown) {
    throw new Error(
      e instanceof Error ? e.message : "MongoDB initialization failed.",
    );
  }
};

const close = async (): Promise<void> => {
  try {
    await client.close();
  } catch (e: unknown) {
    throw new Error(
      e instanceof Error ? e.message : "Failed to close MongoDB connection.",
    );
  }
};

const getDb = (): Db => {
  if (!db) {
    throw new Error("Database not connected. Call connect() first.");
  }
  return db;
};

const getClient = (): MongoClient => client;

export { connect, close, getDb, getClient };
