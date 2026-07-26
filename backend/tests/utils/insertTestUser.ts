import { getDb } from "../../config/database";

export const insertTestUser = async () => {
  return (
    await getDb().collection("users").insertOne({
      name: "test user",
      email: "test@gmail.com",
      password_hash: "testpasswordhash",
      role: "client",
    })
  ).insertedId;
};
