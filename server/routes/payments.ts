import { Router } from "express";
import multer from "multer";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import {
  submitPayment,
  getPaymentHistory,
  getReceipt,
  uploadScreenshot,
  approveAutomaticPayment,
} from "../services/payments.js";
import { initiateJazzCashPayment, verifyCallbackHash, initiateDirectWalletPayment, initiateDirectCardPayment } from "../services/jazzcash.js";
import { getUserSubscription, getSubscriptionInfo } from "../services/subscription.js";
import { config, PlanId } from "../config.js";

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
      return res.status(403).json({ error: "You already have an active subscription. You cannot purchase a new one until it expires." });
    }
    next();
  } catch (err) {
    next(err);
  }
}

router.get("/history", authenticate, async (req: AuthRequest, res) => {
  try {
    const history = await getPaymentHistory(req.user!.userId);
    res.json({ payments: history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch payment history" });
  }
});

router.post(
  "/submit",
  authenticate,
  requireNoActiveSubscription,
  upload.single("screenshot"),
  async (req: AuthRequest, res) => {
    try {
      const { plan, transactionId, paymentMethod } = req.body;
      if (!plan || !paymentMethod) {
        return res.status(400).json({ error: "Plan and payment method are required" });
      }

      const autoApprove = ["jazzcash", "easypaisa"].includes(paymentMethod);
      let screenshotUrl: string | undefined;

      if (req.file) {
        screenshotUrl = await uploadScreenshot(req.user!.userId, req.file);
      }

      // Transaction ID required for non-auto-approve methods
      if (!autoApprove && !transactionId) {
        return res.status(400).json({ error: "Transaction ID is required for manual payments" });
      }

      if (!screenshotUrl && !autoApprove) {
        return res.status(400).json({ error: "Screenshot is required for manual payment methods" });
      }

      const payment = await submitPayment(
        req.user!.userId,
        plan as PlanId,
        transactionId || "",
        screenshotUrl,
        paymentMethod,
        autoApprove
      );

      res.json({
        payment,
        message: autoApprove
          ? "Payment submitted and auto-approved. Your subscription is now active."
          : "Payment submitted. Awaiting admin approval.",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Payment submission failed" });
    }
  }
);

router.get("/receipt/:receiptNo", authenticate, async (req: AuthRequest, res) => {
  try {
    const receipt = await getReceipt(String(req.params.receiptNo), req.user!.userId);
    res.json({ receipt });
  } catch {
    res.status(404).json({ error: "Receipt not found" });
  }
});

// 💳 JazzCash Hosted Checkout — Initiate Payment
router.post("/jazzcash/initiate", authenticate, requireNoActiveSubscription, async (req: AuthRequest, res) => {
  try {
    const { plan } = req.body;
    if (!plan) {
      return res.status(400).json({ error: "Plan parameter is required" });
    }

    const host = req.get("host") || "localhost:3001";
    const paymentDetails = initiateJazzCashPayment(plan as PlanId, req.user!.userId, host);

    res.json(paymentDetails);
  } catch (err: any) {
    console.error("JazzCash initiation error:", err);
    res.status(500).json({ error: err.message || "Failed to initiate JazzCash payment" });
  }
});

// 🔄 JazzCash Hosted Checkout — Public Callback Redirect
router.post("/jazzcash/callback", async (req, res) => {
  try {
    console.log("JazzCash callback received:", req.body);

    const isVerified = verifyCallbackHash(req.body);
    if (!isVerified) {
      console.error("JazzCash Secure Hash verification failed!");
      return res.redirect(`${config.frontendUrl}/dashboard?payment=failed&reason=hash_mismatch`);
    }

    const {
      pp_ResponseCode,
      pp_ResponseMessage,
      pp_BillReference,
      pp_TxnRefNo,
    } = req.body;

    const [userId, plan] = (pp_BillReference || "").split("#");

    if (!userId || !plan) {
      console.error("Invalid bill reference in JazzCash callback:", pp_BillReference);
      return res.redirect(`${config.frontendUrl}/dashboard?payment=failed&reason=invalid_reference`);
    }

    if (pp_ResponseCode === "000") {
      // Automatic instant approval
      console.log(`Payment successful for user: ${userId}, plan: ${plan}`);
      await approveAutomaticPayment(userId, plan as PlanId, pp_TxnRefNo || "JC-AUTO");
      return res.redirect(`${config.frontendUrl}/dashboard?payment=success`);
    } else {
      console.warn(`JazzCash payment failed with code: ${pp_ResponseCode}, msg: ${pp_ResponseMessage}`);
      return res.redirect(
        `${config.frontendUrl}/dashboard?payment=failed&reason=${encodeURIComponent(
          pp_ResponseMessage || "Payment rejected"
        )}`
      );
    }
  } catch (err: any) {
    console.error("Error handling JazzCash callback:", err);
    res.redirect(`${config.frontendUrl}/dashboard?payment=failed&reason=internal_error`);
  }
});

// 💳 JazzCash Direct Wallet — Mobile Wallet Direct checkout
router.post("/jazzcash/direct-wallet", authenticate, requireNoActiveSubscription, async (req: AuthRequest, res) => {
  try {
    const { plan, mobileNumber } = req.body;
    if (!plan || !mobileNumber) {
      return res.status(400).json({ error: "Plan and mobile number are required" });
    }

    const result = await initiateDirectWalletPayment(plan as PlanId, req.user!.userId, mobileNumber);

    if (result.success) {
      const paymentInfo = await approveAutomaticPayment(
        req.user!.userId,
        plan as PlanId,
        result.txnRefNo || "JC-MWALLET"
      );
      res.json({
        success: true,
        message: "Payment authorized successfully! Your subscription is active.",
        payment: paymentInfo.payment,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.responseMessage || "Failed to authorize wallet payment",
        code: result.responseCode,
      });
    }
  } catch (err: any) {
    console.error("Direct wallet error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// 💳 JazzCash Direct Card — Credit/Debit Card Direct checkout
router.post("/jazzcash/direct-card", authenticate, requireNoActiveSubscription, async (req: AuthRequest, res) => {
  try {
    const { plan, cardNumber, cardExpiry, cardCvv, cardHolder } = req.body;
    if (!plan || !cardNumber || !cardExpiry || !cardCvv || !cardHolder) {
      return res.status(400).json({ error: "All card details are required" });
    }

    const result = await initiateDirectCardPayment(plan as PlanId, req.user!.userId, {
      cardNumber,
      cardExpiry,
      cardCvv,
      cardHolder,
    });

    if (result.success) {
      const paymentInfo = await approveAutomaticPayment(
        req.user!.userId,
        plan as PlanId,
        result.txnRefNo || "JC-CARD"
      );
      res.json({
        success: true,
        message: "Card charged successfully! Your subscription is active.",
        payment: paymentInfo.payment,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.responseMessage || "Card transaction failed",
        code: result.responseCode,
      });
    }
  } catch (err: any) {
    console.error("Direct card error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;
