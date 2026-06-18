import { Router } from "express";
import multer from "multer";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import {
  submitPayment,
  getPaymentHistory,
  getReceipt,
  uploadScreenshot,
} from "../services/payments.js";
import { getUserSubscription, getSubscriptionInfo } from "../services/subscription.js";
import { config, PLANS, PlanId } from "../config.js";
import { sendPaymentSubmittedEmail, sendPaymentRequestAdminEmail } from "../lib/email.js";
import { supabase } from "../db.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"));
  },
});

const router = Router();

async function requireNoActiveSubscription(req: AuthRequest, res: any, next: any) {
  try {
    const sub = await getUserSubscription(req.user!.userId);
    const info = getSubscriptionInfo(sub, req.user!.role);
    if (info.status === "active" && info.hasAccess) {
      return res.status(403).json({
        error: "You already have an active subscription. You cannot purchase a new one until it expires.",
      });
    }
    next();
  } catch (err) {
    next(err);
  }
}

// GET /api/payments/history
router.get("/history", authenticate, async (req: AuthRequest, res) => {
  try {
    const history = await getPaymentHistory(req.user!.userId);
    res.json({ payments: history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch payment history" });
  }
});

// POST /api/payments/submit  — Manual payment proof (screenshot + transaction ID)
router.post(
  "/submit",
  authenticate,
  requireNoActiveSubscription,
  upload.single("screenshot"),
  async (req: AuthRequest, res) => {
    try {
      const { plan, transactionId, paymentMethod, senderBankName } = req.body;

      if (!plan || !paymentMethod) {
        return res.status(400).json({ error: "Plan and payment method are required" });
      }

      if (!transactionId || !transactionId.trim()) {
        return res.status(400).json({ error: "Transaction ID is required" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Payment screenshot is required" });
      }

      if (paymentMethod === "bank" && (!senderBankName || !senderBankName.trim())) {
        return res.status(400).json({ error: "Bank name is required for bank transfer" });
      }

      const screenshotUrl = await uploadScreenshot(req.user!.userId, req.file);

      // Build enriched transaction ID for bank transfer (include bank name)
      const enrichedTxnId =
        paymentMethod === "bank" && senderBankName
          ? `${transactionId.trim()} [${senderBankName.trim()}]`
          : transactionId.trim();

      const payment = await submitPayment(
        req.user!.userId,
        plan as PlanId,
        enrichedTxnId,
        screenshotUrl,
        paymentMethod,
        false // always require admin approval for manual payments
      );

      // Async email trigger
      try {
        const { data: userData } = await supabase
          .from("users")
          .select("name, email")
          .eq("id", req.user!.userId)
          .single();

        if (userData) {
          const planName = PLANS[plan as PlanId]?.name || plan;
          const planPkr = PLANS[plan as PlanId]?.pkr || 0;
          sendPaymentSubmittedEmail(userData.email, userData.name, planName, planPkr).catch((err) => {
            console.error("Failed sending payment confirmation email:", err);
          });
          // Notify admin inbox of the new payment request.
          sendPaymentRequestAdminEmail({
            userName: userData.name,
            userEmail: userData.email,
            planName,
            amountPkr: planPkr,
            transactionId: enrichedTxnId,
            paymentMethod,
          }).catch((err) => {
            console.error("Failed sending admin payment request email:", err);
          });
        }
      } catch (emailErr) {
        console.error("Failed fetching user details for payment email:", emailErr);
      }

      res.json({
        payment,
        message: "Payment submitted successfully. Admin will verify and activate your subscription within 2-4 hours.",
      });
    } catch (err: any) {
      console.error("Payment submission error:", err);
      res.status(500).json({ error: err?.message || "Payment submission failed" });
    }
  }
);

// GET /api/payments/receipt/:receiptNo
router.get("/receipt/:receiptNo", authenticate, async (req: AuthRequest, res) => {
  try {
    const receipt = await getReceipt(String(req.params.receiptNo), req.user!.userId);
    res.json({ receipt });
  } catch {
    res.status(404).json({ error: "Receipt not found" });
  }
});

export default router;
