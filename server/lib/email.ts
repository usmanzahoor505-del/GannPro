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

  try {
    await transporter.sendMail({
      from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
      to: email,
      subject: "Your GannPro9 Verification Code",
      html,
    });
  } catch (error) {
    console.error("OTP email send failed:", error);
    console.log(`[DEV] OTP for ${email}: ${otp}`);
  }
}

export async function sendContactEmail(
  name: string,
  userEmail: string,
  phone: string,
  subjectText: string,
  message: string
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#05070f;font-family:Arial,sans-serif;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#05070f;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0b1120;border-radius:16px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;text-align:left;">
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:28px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:bold;">GannPro9 Support Request</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:12px;">New message from contact form</p>
        </td></tr>
        <tr><td style="padding:32px;color:#cbd5e1;font-size:14px;line-height:1.6;">
          <h2 style="color:#fff;font-size:18px;margin-top:0;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:8px;">Customer Information</h2>
          <table width="100%" cellpadding="4" cellspacing="0" style="margin-bottom:20px;">
            <tr><td width="120" style="color:#64748b;font-weight:bold;">Full Name:</td><td style="color:#f8fafc;">${name}</td></tr>
            <tr><td style="color:#64748b;font-weight:bold;">Email Address:</td><td style="color:#f8fafc;"><a href="mailto:${userEmail}" style="color:#a78bfa;text-decoration:none;">${userEmail}</a></td></tr>
            <tr><td style="color:#64748b;font-weight:bold;">Phone Number:</td><td style="color:#f8fafc;">${phone || "Not provided"}</td></tr>
            <tr><td style="color:#64748b;font-weight:bold;">Subject:</td><td style="color:#f8fafc;font-weight:bold;">${subjectText}</td></tr>
          </table>
          
          <h2 style="color:#fff;font-size:18px;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:8px;">Message Details</h2>
          <div style="background:#05070f;border:1px solid rgba(255,255,255,0.05);border-radius:12px;padding:20px;color:#e2e8f0;white-space:pre-wrap;font-family:inherit;">${message}</div>
        </td></tr>
        <tr><td style="padding:16px 32px 28px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
          <p style="margin:0;color:#475569;font-size:11px;">© ${new Date().getFullYear()} GannPro9. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // Try using active transport, fallback to console log if transporter fails/not configured
  if (!config.smtp.user) {
    console.log(`[DEV CONTACT EMAIL] To: arbaz90salman@gmail.com, From: ${userEmail}, Subj: ${subjectText}, Msg: ${message}`);
    return;
  }

  // 1. Send email to admin
  let adminSent = false;
  let adminError: any = null;
  try {
    await transporter.sendMail({
      from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
      to: "arbaz90salman@gmail.com",
      replyTo: userEmail,
      subject: `[GannPro9 Support] ${subjectText} - ${name}`,
      html,
    });
    adminSent = true;
  } catch (err) {
    adminError = err;
    console.error("Failed to send contact email to admin:", err);
  }

  // 2. Send automatic confirmation copy to the user
  const customerHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#05070f;font-family:Arial,sans-serif;color:#cbd5e1;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#05070f;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0b1120;border-radius:16px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;text-align:left;">
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:28px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:bold;">GannPro9 Support</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:12px;">We have received your message</p>
        </td></tr>
        <tr><td style="padding:32px;color:#cbd5e1;font-size:14px;line-height:1.6;">
          <p style="color:#fff;font-size:16px;font-weight:bold;margin-top:0;">Hello ${name},</p>
          <p>
            Thank you for contacting GannPro9 support. We have received your inquiry regarding <strong>${subjectText}</strong>. 
            Our support team will review your details and respond to you at this email address within 24–48 business hours.
          </p>
          
          <h2 style="color:#fff;font-size:15px;margin-top:24px;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:8px;">Copy of Your Message:</h2>
          <div style="background:#05070f;border:1px solid rgba(255,255,255,0.05);border-radius:12px;padding:20px;color:#94a3b8;white-space:pre-wrap;font-family:inherit;">${message}</div>
          
          <p style="margin-top:24px;font-size:12px;color:#64748b;">
            This is an automated confirmation of your request. Please do not reply directly to this email.
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

  try {
    await transporter.sendMail({
      from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
      to: userEmail,
      subject: `[GannPro9 Support] Message Received - ${subjectText}`,
      html: customerHtml,
    });
  } catch (err) {
    console.error("Failed to send contact confirmation copy to customer:", err);
  }

  if (!adminSent) {
    throw adminError || new Error("Failed to send message to admin/support.");
  }
}

export async function sendPaymentSubmittedEmail(
  email: string,
  name: string,
  planName: string,
  amountPkr: number
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#05070f;font-family:Arial,sans-serif;color:#cbd5e1;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#05070f;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0b1120;border-radius:16px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;text-align:left;">
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:28px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:bold;">GannPro9</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:12px;">WD Gann Trading Calculator</p>
        </td></tr>
        <tr><td style="padding:32px;color:#cbd5e1;font-size:14px;line-height:1.6;">
          <p style="color:#fff;font-size:16px;font-weight:bold;margin-top:0;">Hello ${name || "Subscriber"},</p>
          <p>
            Thank you for your payment submission for the <strong>${planName}</strong> plan. We have received your payment details and screenshot.
          </p>
          <p>
            Your payment of <strong>${amountPkr.toLocaleString()} PKR</strong> is currently under verification. Our administrative team will review the transaction details against our records and approve your subscription shortly.
          </p>
          <div style="margin:20px 0;padding:16px;background:#05070f;border:1px solid rgba(255,255,255,0.05);border-radius:12px;">
            <p style="margin:0;font-size:13px;color:#94a3b8;">
              <strong>Estimated Verification Time:</strong> 2–4 Hours
            </p>
          </div>
          <p>
            Once verified, your subscription will be activated automatically, and you will receive another confirmation email with your receipt. You can also monitor your subscription status directly from your dashboard.
          </p>
          <p style="margin-top:24px;font-size:12px;color:#64748b;">
            This is an automated confirmation of your payment submission. Please do not reply directly to this email.
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
    console.log(`[DEV PAYMENT EMAIL] To: ${email}, Plan: ${planName}, Amount: ${amountPkr} PKR`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
      to: email,
      subject: "GannPro9 - Payment Proof Received & Awaiting Verification",
      html,
    });
  } catch (error) {
    console.error("Failed to send payment submitted email:", error);
  }
}

