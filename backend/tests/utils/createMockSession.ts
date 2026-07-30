import type { Request } from "express";
import type { SessionUser } from "../../types";

export function createMockSession(
  overrides: {
    user?: SessionUser;
    cookie?: { maxAge?: number };
    destroy?: (cb: (err?: Error) => void) => void;
  } = {},
): Request["session"] {
  return {
    user: undefined,
    cookie: { maxAge: undefined },
    destroy: (cb: (err?: Error) => void) => cb(),
    ...overrides,
  } as unknown as Request["session"];
}
