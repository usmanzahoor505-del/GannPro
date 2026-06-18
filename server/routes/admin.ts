import { Router } from "express";
import { supabase } from "../db.js";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth.js";
import { approvePayment, rejectPayment, getPendingPayments } from "../services/payments.js";
import { createNotification } from "../services/notifications.js";
import { addMonths } from "../services/subscription.js";

const router = Router();
router.use(authenticate, requireAdmin);

// ── ONE-TIME MIGRATION ENDPOINT ──────────────────────────────────────────────
// Run once:  curl -s -X POST https://ganntradingsignal.cloud/api/admin/run-migration -b /tmp/admin.cookie
// Delete this block after running.
router.post("/run-migration", async (_req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const projectRef  = supabaseUrl.replace("https://", "").split(".")[0];
  const pgMetaBase  = `https://${projectRef}.supabase.co/pg-meta/v0`;
  const headers     = {
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    apikey: serviceKey,
  };

  const results: Record<string, string> = {};

  try {
    // 1. Get all tables to find payments table_id
    const tablesRes = await fetch(`${pgMetaBase}/tables`, { headers });
    if (!tablesRes.ok) {
      const t = await tablesRes.text();
      return res.status(500).json({ error: `Failed to list tables: ${t}` });
    }
    const tables: any[] = await tablesRes.json();
    const paymentsTable = tables.find((t: any) => t.name === "payments" && t.schema === "public");
    if (!paymentsTable) {
      return res.status(404).json({ error: "payments table not found in public schema" });
    }
    const tableId = paymentsTable.id;

    // 2. Get existing columns
    const colsRes = await fetch(`${pgMetaBase}/columns?table_id=${tableId}`, { headers });
    const existingCols: any[] = colsRes.ok ? await colsRes.json() : [];
    const existingNames = new Set(existingCols.map((c: any) => c.name));

    // 3. Add missing columns
    const missing = [
      { name: "payment_method", type: "text" },
      { name: "screenshot_url", type: "text" },
      { name: "transaction_id", type: "text" },
      { name: "receipt_id",     type: "text" },
      { name: "reviewed_at",    type: "timestamptz" },
      { name: "reviewed_by",    type: "uuid" },
    ];

    for (const col of missing) {
      if (existingNames.has(col.name)) {
        results[col.name] = "✅ already exists";
        continue;
      }
      const addRes = await fetch(`${pgMetaBase}/columns`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          table_id: tableId,
          name: col.name,
          type: col.type,
          is_nullable: true,
        }),
      });
      if (addRes.ok) {
        results[col.name] = "✅ added";
      } else {
        const txt = await addRes.text();
        results[col.name] = `⚠️ ${addRes.status}: ${txt}`;
      }
    }

    res.json({ message: "Migration complete", tableId, results });
  } catch (e: any) {
    res.status(500).json({ error: e.message, results });
  }
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
