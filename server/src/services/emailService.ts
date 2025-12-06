import nodemailer from "nodemailer";
import path from "path";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendVerificationEmail(to: string, code: string) {
  const html = `
  <div style="background-color: #dbe9ebff; padding: 40px; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center;">
      <img src="cid:logo" alt="Participium Logo" style="width: 120px; margin-bottom: 20px;">
      <h2 style="color: #333;">Your Participium Verification Code</h2>
      <p style="color: #555; font-size: 16px;">Please enter the code below in the app to verify your account.</p>
      <div style="margin: 30px 0;">
        <span style="display: inline-block; background: #0077b6; color: #fff; font-size: 32px; font-weight: bold; padding: 15px 25px; border-radius: 8px; letter-spacing: 4px;">
          ${code}
        </span>
      </div>
      <p style="color: #555; font-size: 14px;">This code is valid for <strong>30 minutes</strong>.</p>
      <p style="color: #999; font-size: 12px;">If you did not request this email, please ignore it.</p>
    </div>
  </div>
  `;

  await transporter.sendMail({
    from: `"Participium" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: "Account Verification Code",
    html,
    attachments: [{
      filename: 'logo.png',
      path: path.join(__dirname, "../assets/logo.png"),
      cid: 'logo' // same as used in img src
    }]
  });
}

