import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  name: string;
  password_hash: string;
  role: "client" | "trainer";
}

export interface NewUserInput {
  name: string;
  password: string;
  role: "client" | "trainer";
}
