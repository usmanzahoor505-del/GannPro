import crypto from "crypto";
import { config, PLANS, PlanId } from "../config.js";

function getFormattedDateTime(date: Date): string {
  const pad = (num: number) => String(num).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}${mm}${dd}${hh}${min}${ss}`;
}

export function generateSecureHash(payload: Record<string, string>): string {
  const salt = config.jazzcash.integritySalt;
  if (!salt) {
    throw new Error("Missing JAZZCASH_INTEGRITY_SALT in configuration");
  }

  // 1. Get all keys starting with pp_ and having non-empty values
  const sortedKeys = Object.keys(payload)
    .filter((key) => key.startsWith("pp_") && payload[key] !== undefined && payload[key] !== "")
    .sort();

  // 2. Concatenate sorted key=value strings using & separator
  const dataString = sortedKeys.map((key) => `${key}=${payload[key]}`).join("&");

  // 3. Prepend Integrity Salt
  const stringToHash = `${salt}&${dataString}`;

  // 4. Generate HMAC-SHA256 hash using the salt as the secret key
  const hash = crypto
    .createHmac("sha256", salt)
    .update(stringToHash, "utf-8")
    .digest("hex");

  return hash.toUpperCase();
}

export function initiateJazzCashPayment(
  plan: PlanId,
  userId: string,
  host: string
): { url: string; payload: Record<string, string> } {
  const { merchantId, password, checkoutUrl } = config.jazzcash;

  if (!merchantId || !password || !checkoutUrl) {
    throw new Error("Missing JazzCash merchant credentials in environment");
  }

  const now = new Date();
  const expiry = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour expiration

  const amountPkr = PLANS[plan].pkr;
  const amountPaisa = amountPkr * 100; // JazzCash expects amount in Paisa

  // Unique Transaction Reference: T + timestamp + random suffix
  const txnRefNo = `T${now.getTime()}${Math.floor(100 + Math.random() * 900)}`;

  // Secure callback URL pointing to our backend API
  // Using http or https based on environment
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  const returnUrl = `${protocol}://${host}/api/payments/jazzcash/callback`;

  const payload: Record<string, string> = {
    pp_Version: "1.1",
    pp_TxnType: "", // Empty string means Hosted Checkout (Card + Wallet)
    pp_Language: "EN",
    pp_MerchantID: merchantId,
    pp_Password: password,
    pp_TxnRefNo: txnRefNo,
    pp_Amount: String(amountPaisa),
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: getFormattedDateTime(now),
    pp_BillReference: `${userId}#${plan}`, // Combine userId and plan so we can parse on callback
    pp_Description: `GannPro9 ${PLANS[plan].name} Plan Subscription`,
    pp_TxnExpiryDateTime: getFormattedDateTime(expiry),
    pp_ReturnURL: returnUrl,
    pp_SecureHash: "", // Will be filled below
  };

  payload.pp_SecureHash = generateSecureHash(payload);

  return {
    url: checkoutUrl,
    payload,
  };
}

export function verifyCallbackHash(responseBody: Record<string, string>): boolean {
  const receivedHash = responseBody.pp_SecureHash;
  if (!receivedHash) return false;

  // Clone payload without the secure hash key to re-calculate hash
  const payloadToVerify = { ...responseBody };
  delete payloadToVerify.pp_SecureHash;

  try {
    const calculatedHash = generateSecureHash(payloadToVerify);
    return calculatedHash === receivedHash.toUpperCase();
  } catch (err) {
    console.error("Error verifying JazzCash secure hash:", err);
    return false;
  }
}
