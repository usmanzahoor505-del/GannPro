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
import { initiateJazzCashPayment, verifyCallbackHash } from "../services/jazzcash.js";
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
  upload.single("screenshot"),
  async (req: AuthRequest, res) => {
    try {
      const { plan, transactionId } = req.body;
      if (!plan || !transactionId || !req.file) {
        return res.status(400).json({ error: "Plan, transaction ID and screenshot are required" });
      }

      const screenshotUrl = await uploadScreenshot(req.user!.userId, req.file);
      const payment = await submitPayment(
        req.user!.userId,
        plan as PlanId,
        transactionId,
        screenshotUrl
      );

      res.json({ payment, message: "Payment submitted. Awaiting admin approval." });
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
router.post("/jazzcash/initiate", authenticate, async (req: AuthRequest, res) => {
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

export default router;
