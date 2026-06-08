import { supabase } from "../db.js";
import { PLANS, PlanId } from "../config.js";
import {
  activateSubscription,
  setSubscriptionPending,
  setSubscriptionRejected,
} from "./subscription.js";
import { createNotification } from "./notifications.js";

function generateReceiptNo(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `GPN-${date}-${suffix}`;
}

export async function submitPayment(
  userId: string,
  plan: PlanId,
  transactionId: string,
  screenshotUrl: string
) {
  const amount = PLANS[plan].pkr;

  const { data, error } = await supabase
    .from("payments")
    .insert({
      user_id: userId,
      plan_selected: plan,
      amount_pkr: amount,
      transaction_id: transactionId,
      screenshot_url: screenshotUrl,
      status: "pending",
    })
    .select()
    .single();
  if (error) throw error;

  await setSubscriptionPending(userId);
  await createNotification(
    userId,
    "⏳ Payment submitted. Awaiting approval.",
    "info"
  );

  return data;
}

async function withSignedScreenshot<T extends { screenshot_url?: string | null }>(
  payment: T
): Promise<T> {
  if (!payment.screenshot_url) return payment;
  try {
    const signed = await getScreenshotSignedUrl(payment.screenshot_url);
    return { ...payment, screenshot_url: signed };
  } catch {
    return payment;
  }
}

export async function getPaymentHistory(userId: string) {
  const { data, error } = await supabase
    .from("payments")
    .select("*, receipts(*)")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return Promise.all((data || []).map(withSignedScreenshot));
}

export async function getPendingPayments(status?: string) {
  let query = supabase
    .from("payments")
    .select("*, users(name, email)")
    .order("submitted_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return Promise.all((data || []).map(withSignedScreenshot));
}

export async function approvePayment(paymentId: string, adminId: string) {
  const { data: payment, error: pErr } = await supabase
    .from("payments")
    .select("*, users(name, email)")
    .eq("id", paymentId)
    .single();
  if (pErr || !payment) throw new Error("Payment not found");

  const approvalDate = new Date();
  const receiptNo = generateReceiptNo();
  const plan = payment.plan_selected as PlanId;

  const sub = await activateSubscription(payment.user_id, plan, approvalDate);

  const userInfo = Array.isArray(payment.users) ? payment.users[0] : payment.users;

  const { data: receipt, error: rErr } = await supabase
    .from("receipts")
    .insert({
      receipt_no: receiptNo,
      payment_id: paymentId,
      user_id: payment.user_id,
      user_name: userInfo?.name || "User",
      user_email: userInfo?.email || "",
      plan,
      amount_pkr: payment.amount_pkr,
      valid_from: sub.sub_start,
      valid_until: sub.sub_end,
      status: "APPROVED",
    })
    .select()
    .single();
  if (rErr) throw rErr;

  await supabase
    .from("payments")
    .update({
      status: "approved",
      receipt_id: receiptNo,
      reviewed_at: approvalDate.toISOString(),
      reviewed_by: adminId,
    })
    .eq("id", paymentId);

  const planName = PLANS[plan].name;
  await createNotification(
    payment.user_id,
    `✅ Payment approved! Your ${planName} plan is now active.`,
    "success"
  );

  return { payment, receipt, subscription: sub };
}

export async function rejectPayment(paymentId: string, adminId: string) {
  const { data: payment, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();
  if (error || !payment) throw new Error("Payment not found");

  await supabase
    .from("payments")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
      screenshot_url: null,
    })
    .eq("id", paymentId);

  await setSubscriptionRejected(payment.user_id);
  await createNotification(
    payment.user_id,
    "❌ Payment rejected. Please resubmit.",
    "error"
  );

  return payment;
}

export async function getReceipt(receiptNo: string, userId?: string) {
  let query = supabase.from("receipts").select("*").eq("receipt_no", receiptNo);
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query.single();
  if (error) throw error;
  return data;
}

export async function uploadScreenshot(
  userId: string,
  file: Express.Multer.File
): Promise<string> {
  const ext = file.originalname.split(".").pop() || "jpg";
  const storagePath = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("payment-screenshots")
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });
  if (error) throw error;

  return storagePath;
}

export async function getScreenshotSignedUrl(storedPath: string) {
  const key = storedPath.includes("payment-screenshots/")
    ? storedPath.split("payment-screenshots/")[1]
    : storedPath;

  const { data, error } = await supabase.storage
    .from("payment-screenshots")
    .createSignedUrl(key, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function approveAutomaticPayment(
  userId: string,
  plan: PlanId,
  transactionId: string
) {
  const amount = PLANS[plan].pkr;
  const approvalDate = new Date();
  const receiptNo = generateReceiptNo();

  // 1. Insert payment record as approved
  const { data: payment, error: pErr } = await supabase
    .from("payments")
    .insert({
      user_id: userId,
      plan_selected: plan,
      amount_pkr: amount,
      transaction_id: transactionId,
      status: "approved",
      reviewed_at: approvalDate.toISOString(),
    })
    .select()
    .single();

  if (pErr) throw pErr;

  // 2. Activate user subscription
  const sub = await activateSubscription(userId, plan, approvalDate);

  // 3. Get user details for receipt
  const { data: user } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", userId)
    .single();

  // 4. Generate formal receipt
  const { data: receipt, error: rErr } = await supabase
    .from("receipts")
    .insert({
      receipt_no: receiptNo,
      payment_id: payment.id,
      user_id: userId,
      user_name: user?.name || "User",
      user_email: user?.email || "",
      plan,
      amount_pkr: amount,
      valid_from: sub.sub_start,
      valid_until: sub.sub_end,
      status: "APPROVED",
    })
    .select()
    .single();

  if (rErr) throw rErr;

  // 5. Update payment with receipt ID
  await supabase
    .from("payments")
    .update({
      receipt_id: receiptNo,
    })
    .eq("id", payment.id);

  // 6. Notify user
  const planName = PLANS[plan].name;
  await createNotification(
    userId,
    `✅ Payment successful! Your ${planName} plan is now active.`,
    "success"
  );

  return { payment, receipt, subscription: sub };
}
