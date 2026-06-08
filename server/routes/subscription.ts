import { Router } from "express";
import { PLANS } from "../config.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import {
  processExpiryChecks,
  getUserSubscription,
  getSubscriptionInfo,
} from "../services/subscription.js";

const router = Router();

router.get("/plans", (_req, res) => {
  res.json({
    plans: Object.entries(PLANS).map(([id, p]) => ({
      id,
      name: p.name,
      usd: p.usd,
      pkr: p.pkr,
      months: p.months,
      label: `${p.name} — ${p.pkr.toLocaleString()} PKR (${p.months} Month${p.months > 1 ? "s" : ""})`,
    })),
  });
});

router.get("/status", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    await processExpiryChecks(userId);
    const sub = await getUserSubscription(userId);
    const info = getSubscriptionInfo(sub, role);

    res.json(info);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get subscription status" });
  }
});

export default router;
