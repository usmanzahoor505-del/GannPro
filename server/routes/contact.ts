import { Router } from "express";
import { sendContactEmail } from "../lib/email.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "Name, email, subject, and message are required" });
    }

    const subjectText = 
      subject === "subscription" ? "Subscription & Billing" :
      subject === "technical" ? "Technical Support" :
      subject === "accuracy" ? "Signal Accuracy Inquiry" :
      subject === "partnership" ? "Partnership" :
      subject === "privacy" ? "Privacy / Data Request" : "Support Inquiry";

    await sendContactEmail(name, email, phone, subjectText, message);

    res.json({ success: true, message: "Your message has been sent successfully!" });
  } catch (err: any) {
    console.error("Error sending contact email:", err);
    res.status(500).json({ error: err.message || "Failed to send message. Please try again later." });
  }
});

export default router;
