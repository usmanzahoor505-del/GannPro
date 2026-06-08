import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

export const supabase = createClient(
  config.supabase.url || "https://placeholder.supabase.co",
  config.supabase.serviceRoleKey || "placeholder",
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function checkDbConnection(): Promise<boolean> {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) return false;
  const { error } = await supabase.from("users").select("id").limit(1);
  return !error;
}
