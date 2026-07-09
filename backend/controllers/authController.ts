import { Request, Response } from "express";
import { MongoServerError } from "mongodb";
import * as userModel from "../models/User";
import { LoginInput } from "../types";
import bcrypt from "bcrypt";
import validator from "validator"; // Validate  email format on backend
                                  // TODO: instant check on the front end for email validation and other fields as necessary

export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await userModel.getAllUsers();
    res.json(users.map(({ password_hash, ...rest }) => rest));
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve users" });
  }
};

export const registerUser = async (req: Request, res: Response) => {
  let { name, email, password, role }: userModel.NewUserInput = req.body;

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
    const existingUser = await userModel.findUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({ error: "Email already in use." });
    }

    const password_hash = await bcrypt.hash(password, 10);
    await userModel.addUser({ name, email, password_hash, role });
    res.status(201).json({ name, email, role });
  } catch (error) {
    // Backstop for the edge case where two identical emails try to register concurrently.
    if (error instanceof MongoServerError && error.code === 11000) {
      return res.status(400).json({ error: "Email already in use." });
    }
    res.status(500).json({ error: "Failed to register user" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password }: LoginInput = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await userModel.findUserByEmail(email.trim().toLowerCase());

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    req.session.user = {
      id: user._id!.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    res.json({ user: req.session.user });
  } catch (error) {
    res.status(500).json({ error: "Failed to log in" });
  }
};

export const logoutUser = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to log out" });
    }
    res.clearCookie("session");
    res.json({ ok: true });
  });
};

export const getCurrentUser = (req: Request, res: Response) => {
  res.json({ user: req.session.user });
};
