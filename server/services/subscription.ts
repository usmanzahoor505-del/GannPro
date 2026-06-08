import { supabase } from "../db.js";
import { config, PLANS, PlanId } from "../config.js";
import { createNotification } from "./notifications.js";

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function getPlanDurationMonths(plan: PlanId): number {
  return PLANS[plan].months;
}

export async function getUserSubscription(userId: string) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createTrialSubscription(userId: string) {
  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + config.trialDays);

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      status: "trial",
      trial_start: now.toISOString(),
      trial_end: trialEnd.toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function processExpiryChecks(userId: string) {
  const sub = await getUserSubscription(userId);
  if (!sub) return sub;

  const now = new Date();

  if (sub.status === "trial" && sub.trial_end && new Date(sub.trial_end) < now) {
    await supabase.from("subscriptions").update({ status: "expired" }).eq("id", sub.id);
    await createNotification(
      userId,
      "🔒 Your free trial has ended. Subscribe to continue.",
      "error"
    );
    return { ...sub, status: "expired" };
  }

  if (sub.status === "trial" && sub.trial_end) {
    const daysLeft = Math.ceil(
      (new Date(sub.trial_end).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft === 1) {
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", userId)
        .ilike("message", "%trial expires in 1 day%")
        .gte("created_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);
      if (!existing?.length) {
        await createNotification(userId, "⚠️ Your trial expires in 1 day.", "warning");
      }
    }
  }

  if (sub.status === "active" && sub.sub_end && new Date(sub.sub_end) < now) {
    await supabase.from("subscriptions").update({ status: "expired" }).eq("id", sub.id);
    await createNotification(
      userId,
      "🔒 Your subscription has expired. Renew to continue.",
      "error"
    );
    return { ...sub, status: "expired" };
  }

  if (sub.status === "active" && sub.sub_end) {
    const daysLeft = Math.ceil(
      (new Date(sub.sub_end).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft <= 3 && daysLeft > 0) {
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", userId)
        .ilike("message", "%subscription expires in 3 days%")
        .gte("created_at", new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);
      if (!existing?.length) {
        await createNotification(
          userId,
          "⚠️ Your subscription expires in 3 days.",
          "warning"
        );
      }
    }
  }

  return sub;
}

export function canAccessCalculator(
  status: string,
  role: string
): boolean {
  if (role === "admin") return true;
  return status === "trial" || status === "active";
}

export function getSubscriptionInfo(sub: Record<string, unknown> | null, role: string) {
  if (role === "admin") {
    return {
      status: "active",
      plan: null,
      planName: "Admin",
      trialStart: null,
      trialEnd: null,
      subStart: null,
      subEnd: null,
      daysRemaining: 999,
      hoursRemaining: 0,
      hasAccess: true,
      message: null,
    };
  }

  if (!sub) {
    return {
      status: "expired",
      plan: null,
      planName: null,
      trialStart: null,
      trialEnd: null,
      subStart: null,
      subEnd: null,
      daysRemaining: 0,
      hoursRemaining: 0,
      hasAccess: false,
      message: "Your free trial has ended. Please subscribe to continue.",
    };
  }

  const status = sub.status as string;
  const now = new Date();
  let endDate: Date | null = null;

  if (status === "trial" && sub.trial_end) endDate = new Date(sub.trial_end as string);
  else if (status === "active" && sub.sub_end) endDate = new Date(sub.sub_end as string);

  let daysRemaining = 0;
  let hoursRemaining = 0;
  if (endDate && endDate > now) {
    const diff = endDate.getTime() - now.getTime();
    daysRemaining = Math.floor(diff / (1000 * 60 * 60 * 24));
    hoursRemaining = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  }

  const plan = sub.plan as PlanId | null;
  const planName = plan ? PLANS[plan]?.name : null;
  const hasAccess = canAccessCalculator(status, role);

  let message: string | null = null;
  if (status === "pending") message = "⏳ Payment Pending — Waiting for Admin Approval";
  else if (status === "rejected") message = "❌ Payment Rejected. Please resubmit your payment proof or contact support.";
  else if (status === "expired" || !hasAccess)
    message = "Your free trial has ended. Please subscribe to continue.";

  return {
    status,
    plan,
    planName,
    trialStart: sub.trial_start,
    trialEnd: sub.trial_end,
    subStart: sub.sub_start,
    subEnd: sub.sub_end,
    daysRemaining,
    hoursRemaining,
    hasAccess,
    message,
  };
}

export async function activateSubscription(
  userId: string,
  plan: PlanId,
  approvalDate: Date
) {
  const subEnd = addMonths(approvalDate, getPlanDurationMonths(plan));

  const existing = await getUserSubscription(userId);
  if (existing) {
    const { data, error } = await supabase
      .from("subscriptions")
      .update({
        plan,
        status: "active",
        sub_start: approvalDate.toISOString(),
        sub_end: subEnd.toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      plan,
      status: "active",
      sub_start: approvalDate.toISOString(),
      sub_end: subEnd.toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setSubscriptionPending(userId: string) {
  const sub = await getUserSubscription(userId);
  if (sub) {
    await supabase
      .from("subscriptions")
      .update({ status: "pending" })
      .eq("id", sub.id);
  }
}

export async function setSubscriptionRejected(userId: string) {
  const sub = await getUserSubscription(userId);
  if (sub) {
    await supabase
      .from("subscriptions")
      .update({ status: "rejected" })
      .eq("id", sub.id);
  }
}
