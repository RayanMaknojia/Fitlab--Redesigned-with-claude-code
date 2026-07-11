import { ObjectId } from "mongodb";

export const parseObjectId = (value: unknown): ObjectId | null => {
  if (typeof value !== "string" || !ObjectId.isValid(value)) {
    return null;
  }

  return new ObjectId(value);
};
