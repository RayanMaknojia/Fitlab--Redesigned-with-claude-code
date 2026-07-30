import bcrypt from "bcrypt";

jest.mock("../../services/mailer", () => ({
  __esModule: true,
  sendMail: jest.fn().mockResolvedValue(undefined),
}));

import { createMockReq } from "../utils/createMockReq";
import { createMockRes } from "../utils/createMockRes";
import { close, connect, getDb } from "../../config/database";
import * as userModel from "../../models/User";
import * as clientModel from "../../models/Client";
import * as passwordResetTokenModel from "../../models/PasswordResetToken";
import { sendMail } from "../../services/mailer";
import { forgotPassword, resetPassword } from "../../controllers/passwordResetController";

const sendMailMock = sendMail as jest.Mock;

beforeAll(async () => {
  await connect();
  await Promise.all([
    userModel.init(),
    clientModel.init(),
    passwordResetTokenModel.init(),
  ]);
});

afterAll(async () => {
  await close();
});

afterEach(async () => {
  await getDb().collection("users").deleteMany({});
  await getDb().collection("clients").deleteMany({});
  await getDb().collection("password_reset_tokens").deleteMany({});
  sendMailMock.mockClear();
});

function extractTokenFromEmailHtml(html: string): string {
  const href = html.match(/href="([^"]+)"/)?.[1];
  return new URL(href!).searchParams.get("token")!;
}

describe("forgotPassword", () => {
  it("returns 400 when email is missing", async () => {
    const req = createMockReq({ body: {} });
    const { res, statusMock, jsonMock } = createMockRes();

    await forgotPassword(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Email is required" });
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the request body is missing entirely", async () => {
    const req = createMockReq({ body: undefined });
    const { res, statusMock, jsonMock } = createMockRes();

    await forgotPassword(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Email is required" });
  });

  it("creates a reset token and emails it when the account exists", async () => {
    await userModel.addUser({
      name: "Forgetful",
      email: "forgetful@example.com",
      password_hash: await bcrypt.hash("original-password", 10),
      role: "client",
    });

    const req = createMockReq({ body: { email: "forgetful@example.com" } });
    const { res, jsonMock } = createMockRes();

    await forgotPassword(req, res);

    expect(jsonMock).toHaveBeenCalledWith({ ok: true });
    expect(sendMailMock).toHaveBeenCalledTimes(1);

    const [to, subject] = sendMailMock.mock.calls[0];
    expect(to).toBe("forgetful@example.com");
    expect(subject).toMatch(/reset/i);

    const user = await userModel.findUserByEmail("forgetful@example.com");
    const token = await getDb()
      .collection("password_reset_tokens")
      .findOne({ user_id: user!._id! });
    expect(token).not.toBeNull();
  });

  it("responds the same way for an unknown email, without sending anything", async () => {
    const req = createMockReq({ body: { email: "nobody@example.com" } });
    const { res, jsonMock } = createMockRes();

    await forgotPassword(req, res);

    expect(jsonMock).toHaveBeenCalledWith({ ok: true });
    expect(sendMailMock).not.toHaveBeenCalled();

    const tokenCount = await getDb()
      .collection("password_reset_tokens")
      .countDocuments({});
    expect(tokenCount).toBe(0);
  });
});

describe("resetPassword", () => {
  it("returns 400 when token or password is missing", async () => {
    const req = createMockReq({ body: { token: "only-a-token" } });
    const { res, statusMock, jsonMock } = createMockRes();

    await resetPassword(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Token and password are required",
    });
  });

  it("returns 400 when the request body is missing entirely", async () => {
    const req = createMockReq({ body: undefined });
    const { res, statusMock, jsonMock } = createMockRes();

    await resetPassword(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Token and password are required",
    });
  });

  it("returns 400 for a token that was never issued", async () => {
    const req = createMockReq({
      body: { token: "not-a-real-token", password: "newpassword123" },
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await resetPassword(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid or expired token" });
  });

  it("returns 400 for an expired token", async () => {
    await userModel.addUser({
      name: "Slowpoke",
      email: "slowpoke@example.com",
      password_hash: await bcrypt.hash("original-password", 10),
      role: "client",
    });
    const user = await userModel.findUserByEmail("slowpoke@example.com");

    const crypto = await import("crypto");
    const rawToken = "expired-raw-token";
    const token_hash = crypto.createHash("sha256").update(rawToken).digest("hex");
    await passwordResetTokenModel.createToken(
      user!._id!,
      token_hash,
      new Date(Date.now() - 1000), // already expired
    );

    const req = createMockReq({
      body: { token: rawToken, password: "newpassword123" },
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await resetPassword(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid or expired token" });
  });

  it("resets the password and makes the token unusable afterward", async () => {
    await userModel.addUser({
      name: "Forgetful",
      email: "forgetful2@example.com",
      password_hash: await bcrypt.hash("original-password", 10),
      role: "client",
    });

    const forgotReq = createMockReq({
      body: { email: "forgetful2@example.com" },
    });
    await forgotPassword(forgotReq, createMockRes().res);

    const [, , html] = sendMailMock.mock.calls[0];
    const token = extractTokenFromEmailHtml(html);

    const resetReq = createMockReq({
      body: { token, password: "brand-new-password" },
    });
    const { res, jsonMock } = createMockRes();

    await resetPassword(resetReq, res);

    expect(jsonMock).toHaveBeenCalledWith({ ok: true });

    const user = await userModel.findUserByEmail("forgetful2@example.com");
    expect(
      await bcrypt.compare("brand-new-password", user!.password_hash),
    ).toBe(true);
    expect(
      await bcrypt.compare("original-password", user!.password_hash),
    ).toBe(false);

    // Reusing the same token should now fail.
    const reuseReq = createMockReq({
      body: { token, password: "another-password" },
    });
    const { res: reuseRes, statusMock: reuseStatusMock } = createMockRes();

    await resetPassword(reuseReq, reuseRes);

    expect(reuseStatusMock).toHaveBeenCalledWith(400);
  });
});
