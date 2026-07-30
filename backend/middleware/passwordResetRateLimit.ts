import rateLimit from "express-rate-limit";

// Slows down inbox-spam abuse of the forgot-password endpoint.
export const forgotPasswordRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many password reset requests. Try again later." },
});

// Slows down brute-forcing the reset token itself.
export const resetPasswordRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again later." },
});
