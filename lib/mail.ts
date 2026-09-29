import nodemailer from "nodemailer";

export async function sendOtpEmail(email: string, code: string, purpose: string) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !user || !pass || !from) {
    throw new Error("SMTP_NOT_CONFIGURED");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to: email,
    subject: `Wanna Denia Team OTP for ${purpose.toLowerCase()}`,
    text: `Your Wanna Denia Team OTP is ${code}. It expires in ${process.env.OTP_EXPIRES_MINUTES ?? 5} minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#050814;color:#e5f6ff;padding:24px">
        <div style="max-width:520px;margin:auto;border:1px solid rgba(56,244,255,.25);border-radius:16px;padding:24px;background:rgba(13,21,38,.88)">
          <h1 style="margin:0 0 12px;color:#38f4ff">Wanna Denia Team</h1>
          <p>Your OTP code is:</p>
          <p style="font-size:32px;letter-spacing:8px;font-weight:700">${code}</p>
          <p>This code expires in ${process.env.OTP_EXPIRES_MINUTES ?? 5} minutes. If you did not request it, ignore this email.</p>
        </div>
      </div>
    `,
  });
}
