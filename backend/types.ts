export interface LoginInput {
  email: string;
  password: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "client" | "trainer";
}

declare module "express-session" {
  interface SessionData {
    user?: SessionUser;
  }
}
