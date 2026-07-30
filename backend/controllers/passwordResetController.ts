import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import * as userModel from "../models/User";
import * as passwordResetTokenModel from "../models/PasswordResetToken";
import { sendMail } from "../services/mailer";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

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
