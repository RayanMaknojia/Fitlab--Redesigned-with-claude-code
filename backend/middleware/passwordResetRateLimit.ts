import rateLimit from "express-rate-limit";

// TODO: bump windowMs back up before pushing (currently 1 min for easier testing).

// Slows down inbox-spam abuse of the forgot-password endpoint.
export const forgotPasswordRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many password reset requests. Try again later." },
});

// Slows down brute-forcing the reset token itself.
export const resetPasswordRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again later." },
});
