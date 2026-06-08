import { supabase } from "../db.js";

type NotifType = "info" | "success" | "warning" | "error";

export async function createNotification(
  userId: string,
  message: string,
  type: NotifType = "info"
) {
  const { data, error } = await supabase
    .from("notifications")
    .insert({ user_id: userId, message, type })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

export async function getUnreadCount(userId: string) {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
  return count || 0;
}

export async function markRead(notificationId: string, userId: string) {
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);
}

export async function markAllRead(userId: string) {
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
}
