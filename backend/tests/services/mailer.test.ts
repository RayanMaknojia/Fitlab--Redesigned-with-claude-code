jest.mock("nodemailer", () => {
  const sendMail = jest.fn().mockResolvedValue(undefined);
  return {
    createTransport: () => ({ sendMail }),
    __mockSendMail: sendMail,
  };
});

import nodemailer from "nodemailer";
import { sendMail } from "../../services/mailer";

const mockSendMail = (nodemailer as unknown as { __mockSendMail: jest.Mock })
  .__mockSendMail;

describe("sendMail", () => {
  it("calls the nodemailer transporter with the expected fields", async () => {
    await sendMail("someone@example.com", "Subject line", "<p>Body</p>");

    expect(mockSendMail).toHaveBeenCalledWith({
      from: expect.stringContaining(process.env.GMAIL_USER!),
      to: "someone@example.com",
      subject: "Subject line",
      html: "<p>Body</p>",
    });
  });
});
