import { Router } from "express";
import { supabase } from "../db.js";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth.js";
import { approvePayment, rejectPayment, getPendingPayments } from "../services/payments.js";
import { createNotification } from "../services/notifications.js";
import { addMonths } from "../services/subscription.js";

const router = Router();
router.use(authenticate, requireAdmin);

// ── ONE-TIME MIGRATION ENDPOINT ──────────────────────────────────────────────
// Run once:  curl -X POST https://ganntradingsignal.cloud/api/admin/run-migration \
//              -H "Cookie: <your admin cookie>"
// Delete this block after running.
router.post("/run-migration", async (_req, res) => {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const projectRef = url.replace("https://", "").split(".")[0];

  const columns = [
    { name: "payment_method", def: "TEXT" },
    { name: "screenshot_url", def: "TEXT" },
    { name: "transaction_id", def: "TEXT" },
    { name: "receipt_id",     def: "TEXT" },
    { name: "reviewed_at",    def: "TIMESTAMPTZ" },
    { name: "reviewed_by",    def: "UUID" },
  ];

  const results: Record<string, string> = {};

  for (const { name, def } of columns) {
    const sql = `ALTER TABLE payments ADD COLUMN IF NOT EXISTS "${name}" ${def};`;
    try {
      const r = await fetch(
        `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: sql }),
        }
      );
      results[name] = r.ok ? "✅ added" : `⚠️ status ${r.status}: ${await r.text()}`;
    } catch (e: any) {
      results[name] = `❌ ${e.message}`;
    }
  }

  // Reload schema cache via notify
  try {
    const { supabase: sb } = await import("../db.js");
    await (sb as any).rpc("pgrst_watch");
  } catch { /* ignore */ }

  res.json({ message: "Migration attempted", results });
});
// ── END MIGRATION ENDPOINT ────────────────────────────────────────────────────


router.get("/stats", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("admin_stats").select("*").single();
    if (error) throw error;
    res.json({ stats: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/users", async (_req, res) => {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, email, role, is_active, created_at")
      .eq("role", "user")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const enriched = await Promise.all(
      (users || []).map(async (u) => {
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", u.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        return { ...u, subscription: sub };
      })
    );

    res.json({ users: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.patch("/users/:id/deactivate", async (req, res) => {
  await supabase.from("users").update({ is_active: false }).eq("id", req.params.id);
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", req.params.id)
    .limit(1)
    .maybeSingle();
  if (sub) {
    await supabase.from("subscriptions").update({ status: "cancelled" }).eq("id", sub.id);
  }
  res.json({ message: "User deactivated" });
});

router.patch("/users/:id/extend", async (req, res) => {
  try {
    const { months } = req.body;
    const extraMonths = parseInt(months) || 1;

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", req.params.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub) return res.status(404).json({ error: "No subscription found" });

    const currentEnd = sub.sub_end ? new Date(sub.sub_end) : new Date();
    const newEnd = addMonths(currentEnd, extraMonths);

    await supabase
      .from("subscriptions")
      .update({ status: "active", sub_end: newEnd.toISOString() })
      .eq("id", sub.id);

    await createNotification(
      req.params.id,
      `Your subscription has been extended by ${extraMonths} month(s).`,
      "success"
    );

    res.json({ message: "Subscription extended", newEnd });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to extend subscription" });
  }
});

router.post("/users/:id/notify", async (req, res) => {
  try {
    const { message, type } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });
    await createNotification(req.params.id, message, type || "info");
    res.json({ message: "Notification sent" });
  } catch (err) {
    res.status(500).json({ error: "Failed to send notification" });
  }
});

router.get("/payments", async (req, res) => {
  try {
    const status = (req.query.status as string) || "pending";
    const payments = await getPendingPayments(status);
    res.json({ payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

router.post("/payments/:id/approve", async (req: AuthRequest, res) => {
  try {
    const result = await approvePayment(String(req.params.id), req.user!.userId);
    res.json({ message: "Payment approved", ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Approval failed" });
  }
});

router.post("/payments/:id/reject", async (req: AuthRequest, res) => {
  try {
    await rejectPayment(String(req.params.id), req.user!.userId);
    res.json({ message: "Payment rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Rejection failed" });
  }
});

export default router;
