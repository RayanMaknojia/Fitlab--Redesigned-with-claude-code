jest.mock("express-rate-limit", () => ({
  __esModule: true,
  default: (options: unknown) => options,
}));

import {
  forgotPasswordRateLimit,
  resetPasswordRateLimit,
} from "../../middleware/passwordResetRateLimit";

describe("forgotPasswordRateLimit", () => {
  it("is configured with a 1 hour window, a limit of 5, and the right message", () => {
    expect(forgotPasswordRateLimit).toMatchObject({
      windowMs: 60 * 60 * 1000,
      limit: 5,
      message: { error: "Too many password reset requests. Try again later." },
    });
  });
});

describe("resetPasswordRateLimit", () => {
  it("is configured with a 1 hour window, a limit of 10, and the right message", () => {
    expect(resetPasswordRateLimit).toMatchObject({
      windowMs: 60 * 60 * 1000,
      limit: 10,
      message: { error: "Too many attempts. Try again later." },
    });
  });
});
