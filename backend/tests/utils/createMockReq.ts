import { Request } from "express";

export function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    params: {},
    body: {},
    ...overrides,
  } as Request;
}
