// @ts-ignore
import nodemailer from "nodemailer";

export async function sendEmail(to: string, subject: string, text: string) {
  if (!process.env.SMTP_HOST) {
    console.warn("SMTP not configured. Skipping email to", to);
    return;
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "no-reply@example.com",
    to,
    subject,
    text,
  });
}