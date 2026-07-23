import { Response } from "express";

export function createMockRes() {
  const jsonMock = jest.fn();
  const statusMock = jest.fn().mockReturnValue({ json: jsonMock });

  const res = {
    json: jsonMock,
    status: statusMock,
  } as unknown as Response;

  return { res, jsonMock, statusMock };
}
