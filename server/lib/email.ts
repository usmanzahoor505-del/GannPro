import nodemailer from "nodemailer";
import { config } from "../config.js";

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
});

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#05070f;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#05070f;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#0b1120;border-radius:16px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:28px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:bold;">GannPro9</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:12px;">WD Gann Trading Calculator</p>
        </td></tr>
        <tr><td style="padding:36px 32px;text-align:center;">
          <p style="margin:0 0 8px;color:#94a3b8;font-size:14px;">Your verification code is:</p>
          <div style="margin:20px 0;padding:20px;background:#05070f;border-radius:12px;border:1px solid rgba(139,92,246,0.3);">
            <span style="font-size:42px;font-weight:bold;letter-spacing:12px;color:#a78bfa;">${otp}</span>
          </div>
          <p style="margin:0 0 16px;color:#64748b;font-size:13px;">This code expires in <strong style="color:#f59e0b;">10 minutes</strong>.</p>
          <p style="margin:0;padding:12px;background:rgba(239,68,68,0.1);border-radius:8px;color:#f87171;font-size:12px;">
            If you did not request this, please ignore this email.
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px 28px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
          <p style="margin:0;color:#475569;font-size:11px;">© ${new Date().getFullYear()} GannPro9. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  if (!config.smtp.user) {
    console.log(`[DEV] OTP for ${email}: ${otp}`);
    return;
  }

  await transporter.sendMail({
    from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
    to: email,
    subject: "Your GannPro9 Verification Code",
    html,
  });
}
