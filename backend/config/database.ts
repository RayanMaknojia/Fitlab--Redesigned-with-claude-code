import { Db, MongoClient } from "mongodb";
import { loadEnvFile } from "process";

loadEnvFile();

const CONNECTION_STRING = process.env.CONNECTION_STRING;

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

const getDb = (): Db => {
  if (!db) {
    throw new Error("Database not connected. Call connect() first.");
  }
  return db;
};

export { connect, getDb };
