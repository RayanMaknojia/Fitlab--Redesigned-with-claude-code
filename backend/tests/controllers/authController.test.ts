import bcrypt from "bcrypt";
import { MongoServerError } from "mongodb";

jest.mock("../../models/User", () => ({
  __esModule: true,
  ...jest.requireActual("../../models/User"),
}));

import { createMockReq } from "../utils/createMockReq";
import { createMockRes } from "../utils/createMockRes";
import { createMockSession } from "../utils/createMockSession";
import { close, connect, getDb } from "../../config/database";
import * as userModel from "../../models/User";
import * as clientModel from "../../models/Client";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  getAllUsers,
} from "../../controllers/authController";
import type { SessionUser } from "../../types";

beforeAll(async () => {
  await connect();
  await Promise.all([userModel.init(), clientModel.init()]);
});

afterAll(async () => {
  await close();
});

afterEach(async () => {
  await getDb().collection("users").deleteMany({});
  await getDb().collection("clients").deleteMany({});
});

describe("registerUser", () => {
  it("returns 400 when required fields are missing", async () => {
    const req = createMockReq({
      body: { name: "Test", email: "test@example.com", role: "client" }, // no password
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await registerUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "A valid name, email, password, and role are required",
    });
  });

  it("returns 400 for an invalid email format", async () => {
    const req = createMockReq({
      body: {
        name: "Test",
        email: "not-an-email",
        password: "password123",
        role: "client",
      },
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await registerUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid email format" });
  });

  it("returns 400 when trying to self-register as admin", async () => {
    const req = createMockReq({
      body: {
        name: "Test",
        email: "wannabe-admin@example.com",
        password: "password123",
        role: "admin",
      },
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await registerUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Role must be 'client' or 'trainer'",
    });

    const stored = await getDb()
      .collection("users")
      .findOne({ email: "wannabe-admin@example.com" });
    expect(stored).toBeNull();
  });

  it("registers a new client, hashes the password, and creates a linked client record", async () => {
    const req = createMockReq({
      body: {
        name: "Test Client",
        email: "client@example.com",
        password: "password123",
        role: "client",
      },
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await registerUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      name: "Test Client",
      email: "client@example.com",
      role: "client",
    });

    const stored = await getDb()
      .collection("users")
      .findOne({ email: "client@example.com" });

    expect(stored).not.toBeNull();
    expect(stored?.password_hash).not.toBe("password123");
    expect(await bcrypt.compare("password123", stored!.password_hash)).toBe(
      true,
    );

    const client = await getDb()
      .collection("clients")
      .findOne({ _id: stored!._id });
    expect(client).not.toBeNull();
  });

  it("registers a new trainer without creating a client record", async () => {
    const req = createMockReq({
      body: {
        name: "Test Trainer",
        email: "trainer@example.com",
        password: "password123",
        role: "trainer",
      },
    });
    const { res, statusMock } = createMockRes();

    await registerUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(201);

    const stored = await getDb()
      .collection("users")
      .findOne({ email: "trainer@example.com" });
    expect(stored).not.toBeNull();

    const client = await getDb()
      .collection("clients")
      .findOne({ _id: stored!._id });
    expect(client).toBeNull();
  });

  it("returns 400 when the email is already in use", async () => {
    const firstReq = createMockReq({
      body: {
        name: "First",
        email: "dupe@example.com",
        password: "password123",
        role: "client",
      },
    });
    await registerUser(firstReq, createMockRes().res);

    const req = createMockReq({
      body: {
        name: "Second",
        email: "dupe@example.com",
        password: "differentpassword",
        role: "client",
      },
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await registerUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Email already in use." });
  });

  it("returns 400 when a duplicate email slips past the pre-check (race condition)", async () => {
    const addUserSpy = jest
      .spyOn(userModel, "addUser")
      .mockRejectedValueOnce(
        new MongoServerError({ message: "E11000 duplicate key error", code: 11000 }),
      );

    const req = createMockReq({
      body: {
        name: "Racer",
        email: "racer@example.com",
        password: "password123",
        role: "client",
      },
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await registerUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Email already in use." });

    addUserSpy.mockRestore();
  });

  it("returns 500 when saving the new user fails for an unrelated reason", async () => {
    const addUserSpy = jest
      .spyOn(userModel, "addUser")
      .mockRejectedValueOnce(new Error("connection reset"));

    const req = createMockReq({
      body: {
        name: "Unlucky",
        email: "unlucky@example.com",
        password: "password123",
        role: "client",
      },
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await registerUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Failed to register user" });

    addUserSpy.mockRestore();
  });
});

describe("loginUser", () => {
  beforeEach(async () => {
    const password_hash = await bcrypt.hash("correct-password", 10);
    await userModel.addUser({
      name: "Login Test",
      email: "login@example.com",
      password_hash,
      role: "client",
    });
  });

  it("returns 400 when email or password is missing", async () => {
    const req = createMockReq({ body: { email: "login@example.com" } });
    const { res, statusMock, jsonMock } = createMockRes();

    await loginUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Email and password are required",
    });
  });

  it("returns 400 when the request body is missing entirely", async () => {
    const req = createMockReq({ body: undefined });
    const { res, statusMock, jsonMock } = createMockRes();

    await loginUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Email and password are required",
    });
  });

  it("returns 401 for an unknown email", async () => {
    const req = createMockReq({
      body: { email: "nobody@example.com", password: "whatever" },
      session: createMockSession(),
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await loginUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid credentials" });
  });

  it("returns 401 for the wrong password", async () => {
    const req = createMockReq({
      body: { email: "login@example.com", password: "wrong-password" },
      session: createMockSession(),
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await loginUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid credentials" });
  });

  it("returns 403 for a blocked user with correct credentials", async () => {
    const password_hash = await bcrypt.hash("correct-password", 10);
    await userModel.addUser({
      name: "Blocked User",
      email: "blocked@example.com",
      password_hash,
      role: "client",
    });
    const blockedUser = await userModel.findUserByEmail("blocked@example.com");
    await userModel.setUserBlocked(blockedUser!._id!, true);

    const req = createMockReq({
      body: { email: "blocked@example.com", password: "correct-password" },
      session: createMockSession(),
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await loginUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "This account has been blocked.",
    });
  });

  it("logs in with correct credentials and stores the session user", async () => {
    const session = createMockSession();
    const req = createMockReq({
      body: { email: "login@example.com", password: "correct-password" },
      session,
    });
    const { res, jsonMock } = createMockRes();

    await loginUser(req, res);

    expect(session.user).toMatchObject({
      name: "Login Test",
      email: "login@example.com",
      role: "client",
    });
    expect(jsonMock).toHaveBeenCalledWith({ user: session.user });
  });

  it("extends the session cookie when rememberMe is set", async () => {
    const session = createMockSession();
    const req = createMockReq({
      body: {
        email: "login@example.com",
        password: "correct-password",
        rememberMe: true,
      },
      session,
    });
    const { res } = createMockRes();

    await loginUser(req, res);

    expect(session.cookie.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("leaves the default cookie maxAge alone when rememberMe is not set", async () => {
    const session = createMockSession({ cookie: { maxAge: 3 * 60 * 60 * 1000 } });
    const req = createMockReq({
      body: { email: "login@example.com", password: "correct-password" },
      session,
    });
    const { res } = createMockRes();

    await loginUser(req, res);

    expect(session.cookie.maxAge).toBe(3 * 60 * 60 * 1000);
  });

  it("returns 500 when the lookup fails for an unrelated reason", async () => {
    const findUserSpy = jest
      .spyOn(userModel, "findUserByEmail")
      .mockRejectedValueOnce(new Error("connection reset"));

    const req = createMockReq({
      body: { email: "login@example.com", password: "correct-password" },
      session: createMockSession(),
    });
    const { res, statusMock, jsonMock } = createMockRes();

    await loginUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Failed to log in" });

    findUserSpy.mockRestore();
  });
});

describe("logoutUser", () => {
  it("destroys the session, clears the cookie, and returns ok", () => {
    const req = createMockReq({ session: createMockSession() });
    const { res, jsonMock } = createMockRes();
    const clearCookieMock = jest.fn();
    (res as unknown as { clearCookie: jest.Mock }).clearCookie =
      clearCookieMock;

    logoutUser(req, res);

    expect(clearCookieMock).toHaveBeenCalledWith("session");
    expect(jsonMock).toHaveBeenCalledWith({ ok: true });
  });

  it("returns 500 if the session fails to destroy", () => {
    const destroyMock = jest.fn((cb: (err?: Error) => void) =>
      cb(new Error("boom")),
    );
    const req = createMockReq({
      session: createMockSession({ destroy: destroyMock }),
    });
    const { res, statusMock, jsonMock } = createMockRes();

    logoutUser(req, res);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Failed to log out" });
  });
});

describe("getCurrentUser", () => {
  it("returns the session user", () => {
    const user: SessionUser = {
      id: "6a5eaaf6318854d554f0382f",
      name: "Someone",
      email: "someone@example.com",
      role: "trainer",
    };
    const req = createMockReq({ session: createMockSession({ user }) });
    const { res, jsonMock } = createMockRes();

    getCurrentUser(req, res);

    expect(jsonMock).toHaveBeenCalledWith({ user });
  });
});

describe("getAllUsers", () => {
  it("returns registered users without their password hashes", async () => {
    await userModel.addUser({
      name: "Visible User",
      email: "visible@example.com",
      password_hash: await bcrypt.hash("password123", 10),
      role: "client",
    });

    const req = createMockReq();
    const { res, jsonMock } = createMockRes();

    await getAllUsers(req, res);

    const [users] = jsonMock.mock.calls[0] as [Array<Record<string, unknown>>];
    const match = users.find((u) => u.email === "visible@example.com");

    expect(match).toBeDefined();
    expect(match?.password_hash).toBeUndefined();
  });

  it("returns 500 when the lookup fails", async () => {
    const getAllUsersSpy = jest
      .spyOn(userModel, "getAllUsers")
      .mockRejectedValueOnce(new Error("connection reset"));

    const req = createMockReq();
    const { res, statusMock, jsonMock } = createMockRes();

    await getAllUsers(req, res);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Failed to retrieve users" });

    getAllUsersSpy.mockRestore();
  });
});
