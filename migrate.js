/**
 * One-time migration script — adds missing columns to `payments` table.
 * Run on VPS:  node migrate.js
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Load .env manually ────────────────────────────────────────────────────────
const envPath = resolve(process.cwd(), ".env");
const envVars = {};
try {
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    envVars[key] = val;
  }
} catch {
  console.error("❌ Could not read .env file — make sure you run this from the project root.");
  process.exit(1);
}

const SUPABASE_URL = envVars["SUPABASE_URL"];
const SERVICE_ROLE_KEY = envVars["SUPABASE_SERVICE_ROLE_KEY"];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── Migration SQL statements ───────────────────────────────────────────────────
// We execute each as an rpc-less insert-based trick via Supabase's REST /rpc
// endpoint calling the built-in pg_catalog exec helper.
// Since Supabase doesn't expose raw SQL in JS client, we use the REST API directly.
const PROJECT_REF = SUPABASE_URL.replace("https://", "").split(".")[0];
const MGMT_API = `https://${SUPABASE_URL.replace("https://", "").replace("http://", "")}/rest/v1/rpc`;

const columns = [
  { name: "payment_method", def: "TEXT" },
  { name: "screenshot_url", def: "TEXT" },
  { name: "transaction_id", def: "TEXT" },
  { name: "receipt_id", def: "TEXT" },
  { name: "reviewed_at", def: "TIMESTAMPTZ" },
];

async function columnExists(colName) {
  const { data, error } = await supabase
    .from("payments")
    .select(colName)
    .limit(0);
  return !error;
}

async function addColumnViaRest(colName, colDef) {
  // Use Supabase's direct PostgreSQL REST endpoint (service role has full access)
  const sql = `ALTER TABLE payments ADD COLUMN IF NOT EXISTS "${colName}" ${colDef};`;
  
  // Supabase exposes a SQL execution endpoint on the project's REST API
  const res = await fetch(
    `https://${PROJECT_REF}.supabase.co/rest/v1/rpc/exec_sql`,
    {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql }),
    }
  );

  if (res.ok) return { ok: true };
  
  // Fallback: try the management API query endpoint
  const res2 = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  const text2 = await res2.text();
  return { ok: res2.ok, body: text2 };
}

async function run() {
  console.log(`\n🚀 GannPro9 — Payments table migration`);
  console.log(`   Supabase project: ${PROJECT_REF}\n`);

  for (const { name, def } of columns) {
    process.stdout.write(`   Adding column "${name}" (${def}) … `);

    const exists = await columnExists(name);
    if (exists) {
      console.log("✅ already exists");
      continue;
    }

    const result = await addColumnViaRest(name, def);
    if (result.ok) {
      console.log("✅ added");
    } else {
      console.log(`⚠️  could not add automatically — run this in Supabase SQL Editor:`);
      console.log(`       ALTER TABLE payments ADD COLUMN IF NOT EXISTS "${name}" ${def};`);
    }
  }

  // Reload PostgREST schema cache
  process.stdout.write(`\n   Reloading schema cache … `);
  try {
    await supabase.rpc("reload_schema_cache").single();
    console.log("✅");
  } catch {
    // Not fatal — schema cache auto-reloads every 5 min
    console.log("ℹ️  will auto-reload within 5 min");
  }

  console.log(`\n✅ Migration complete. Restart the API: pm2 restart all\n`);
}

run().catch((e) => {
  console.error("❌ Migration failed:", e.message);
  process.exit(1);
});
