import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const smtp = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: process.env.SMTP_SECURE !== "false",
  user: process.env.SMTP_USER || "",
  pass: process.env.SMTP_PASS || "",
  fromName: process.env.SMTP_FROM_NAME || "GannPro9",
  fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "",
};

console.log("SMTP Config Loaded:", {
  host: smtp.host,
  port: smtp.port,
  secure: smtp.secure,
  user: smtp.user,
  fromEmail: smtp.fromEmail,
  passLength: smtp.pass ? smtp.pass.length : 0,
});

const transporter = nodemailer.createTransport({
  host: smtp.host,
  port: smtp.port,
  secure: smtp.secure,
  auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
});

async function main() {
  console.log("Verifying transporter connection...");
  try {
    await transporter.verify();
    console.log("Transporter verification successful!");
  } catch (error) {
    console.error("Transporter verification failed:", error);
    process.exit(1);
  }

  // Attempt to send a test email to the user email (which is the user's admin email)
  console.log(`Sending test email to ${smtp.user}...`);
  try {
    const info = await transporter.sendMail({
      from: `"${smtp.fromName}" <${smtp.fromEmail}>`,
      to: smtp.user,
      subject: "GannPro9 SMTP Test Email",
      text: "This is a test email to verify that SMTP is working properly on this machine.",
      html: "<p>This is a test email to verify that SMTP is working properly on this machine.</p>",
    });
    console.log("Email sent successfully! Message ID:", info.messageId);
  } catch (error) {
    console.error("Failed to send test email:", error);
  }
}

main().catch(console.error);
