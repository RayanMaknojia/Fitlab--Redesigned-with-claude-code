import { Request, Response } from "express";
import { MongoServerError } from "mongodb";
import crypto from "crypto";
import * as userModel from "../models/User";
import * as passwordResetTokenModel from "../models/PasswordResetToken";
import { sendMail } from "../services/mailer";
import { LoginInput } from "../types";
import bcrypt from "bcrypt";
import validator from "validator"; // Validate  email format on backend
                                  // TODO: instant check on the front end for email validation and other fields as necessary

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

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

  if (role !== "client" && role !== "trainer") {
    return res.status(400).json({ error: "Role must be 'client' or 'trainer'" });
  }

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
  const { email, password, rememberMe }: LoginInput = req.body ?? {};

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
    // Set session cookie maxAge based on rememberMe option
    if (rememberMe) {
      req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 1 week
    }

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

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body ?? {};

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const user = await userModel.findUserByEmail(email.trim().toLowerCase());

  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const expires_at = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await passwordResetTokenModel.createToken(
      user._id!,
      hashToken(rawToken),
      expires_at,
    );

    const resetLink = `${FRONTEND_ORIGIN}/reset-password?token=${rawToken}`;
    await sendMail(
      user.email,
      "Reset your FitLab password",
      `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetLink}">${resetLink}</a></p>`,
    );
  }

  // Same response whether or not the email exists, so this can't be used to
  // check which emails are registered.
  res.json({ ok: true });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body ?? {};

  if (!token || !password) {
    return res.status(400).json({ error: "Token and password are required" });
  }

  const resetToken = await passwordResetTokenModel.findValidByTokenHash(
    hashToken(token),
  );

  if (!resetToken) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  const password_hash = await bcrypt.hash(password, 10);
  await userModel.updatePasswordHash(resetToken.user_id, password_hash);
  await passwordResetTokenModel.deleteAllForUser(resetToken.user_id);

  res.json({ ok: true });
};
