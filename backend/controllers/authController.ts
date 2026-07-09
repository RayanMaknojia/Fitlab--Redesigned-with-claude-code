import { Request, Response } from "express";
import { helpers } from "../db";
import { NewUserInput } from "../types";
import bcrypt from "bcrypt";
import validator from "validator"; // Validate  email format on backend
                                  // TODO: instant check on the front end for email validation and other fields as necessary

export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await helpers.getAllUsers();
    res.json(users.map(({ password_hash, ...rest }) => rest));
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve users" });
  }
};

export const registerUser = async (req: Request, res: Response) => {
  let { name, email, password, role }: NewUserInput = req.body;

  name = name?.trim();
  email = email?.trim().toLowerCase();

  if (!name || !email || !password || !role) {
    return res.status(400).json({
      error: "A valid name, email, password, and role are required",
    });
  }

  if (!validator.isEmail(email)) {
     return res.status(400).json({ error: "Invalid email format" });
  }

  // if (role !== "client" && role !== "trainer") {                          // This will be a radio button so I dont think we need this
  //   return res.status(400).json({ error: "Role must be 'client' or 'trainer'" });
  // }

  try {
    const existingUser = await helpers.findUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({ error: "Email already in use." });
    }

    const password_hash = await bcrypt.hash(password, 10);
    await helpers.addUser({ name, email, password_hash, role });
    res.status(201).json({ name, email, role });
  } catch (error) {
    res.status(500).json({ error: "Failed to register user" });
  }
};
