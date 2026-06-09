import dotenv from "dotenv";
import path from "path";

// Always load .env from project root (where npm run dev is executed from)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env: ${key}`);
  return val;
}

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl:
    process.env.FRONTEND_URL ||
    process.env.VITE_FRONTEND_URL ||
    "https://www.ganntradingsignal.cloud",

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-me",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me",
    accessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",
  },

  cookie: {
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: (process.env.COOKIE_SAME_SITE || "lax") as "lax" | "strict" | "none",
    domain: process.env.COOKIE_DOMAIN || undefined,
  },

  supabase: {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },

  smtp: {
    host: process.env.SMTP_HOST || "smtp.hostinger.com",
    port: parseInt(process.env.SMTP_PORT || "465", 10),
    secure: process.env.SMTP_SECURE !== "false",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    fromName: process.env.SMTP_FROM_NAME || "GannPro9",
    fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "",
  },

  trialDays: parseInt(process.env.TRIAL_DAYS || "3", 10),
  otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || "10", 10),
  otpResendCooldown: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || "60", 10),

  payment: {
    msisdn: process.env.PAYMENT_MSISDN || "03099716270",
  },

  jazzcash: {
    merchantId: process.env.JAZZCASH_MERCHANT_ID || "",
    password: process.env.JAZZCASH_PASSWORD || "",
    integritySalt: process.env.JAZZCASH_INTEGRITY_SALT || "",
    checkoutUrl: process.env.JAZZCASH_URL || "https://payments.jazzcash.com.pk/CustomerPortal/transactionPage",
    apiUrl: process.env.JAZZCASH_API_URL || "https://payments.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction",
    cardApiUrl: process.env.JAZZCASH_CARD_API_URL || "https://payments.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoCardTransaction",
  },
};

export const PLANS = {
  basic: { name: "Basic", usd: 100, pkr: 27800, months: 1 },
  standard: { name: "Standard", usd: 300, pkr: 83400, months: 3 },
  pro: { name: "Pro", usd: 500, pkr: 139000, months: 6 },
} as const;

export type PlanId = keyof typeof PLANS;
