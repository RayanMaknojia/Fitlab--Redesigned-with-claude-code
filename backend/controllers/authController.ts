import { Request, Response } from "express";
import { helpers } from "../db";
import { NewUserInput } from "../types";
import bcrypt from "bcrypt";
import validator from 'validator'; // validate  email format on backend
                                  // TODO: instant check from front end for email validation as well

export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await helpers.getAllUsers();
    res.json(users.map(({ password_hash, ...rest }) => rest));
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve users" });
  }
};

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password, role }: NewUserInput = req.body;


  if (!name || !validator.isEmail(email)|| !password || !role) {
    return res.status(400).json({ error: "A valid name, email, password, and role are required" });
  }

  if (role !== "client" && role !== "trainer") {
    return res.status(400).json({ error: "Role must be 'client' or 'trainer'" });
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);
    await helpers.addUser({ name, email, password_hash, role });
    res.status(201).json({ name, role });
  } catch (error) {
    res.status(500).json({ error: "Failed to register user" });
  }
};