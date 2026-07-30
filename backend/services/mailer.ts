import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD must be set.");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

export const sendMail = async (
  to: string,
  subject: string,
  html: string,
): Promise<void> => {
  await transporter.sendMail({
    from: `FitLab <${GMAIL_USER}>`,
    to,
    subject,
    html,
  });
};
