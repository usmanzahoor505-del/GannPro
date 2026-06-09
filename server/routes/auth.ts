import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { supabase } from "../db.js";
import { config } from "../config.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt.js";
import { sendOtpEmail } from "../lib/email.js";
import { createTrialSubscription } from "../services/subscription.js";
import { createNotification } from "../services/notifications.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";

const router = Router();

function setAuthCookies(res: Response, userId: string, email: string, role: "user" | "admin") {
  const payload = { userId, email, role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const cookieOpts = {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.cookie.domain,
    path: "/",
  };
  res.cookie("accessToken", accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/register — send OTP, do NOT create account
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    if (existing) return res.status(400).json({ error: "Email already registered" });

    const { data: recentOtp } = await supabase
      .from("otp_verifications")
      .select("created_at")
      .eq("email", email.toLowerCase())
      .eq("is_used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentOtp) {
      const elapsed = (Date.now() - new Date(recentOtp.created_at).getTime()) / 1000;
      if (elapsed < config.otpResendCooldown) {
        return res.status(429).json({
          error: "Please wait before requesting another OTP",
          cooldown: Math.ceil(config.otpResendCooldown - elapsed),
        });
      }
    }

    const otp = generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + config.otpExpiryMinutes);
    const passwordHash = await bcrypt.hash(password, 12);

    await supabase.from("otp_verifications").insert({
      email: email.toLowerCase(),
      otp_code: otp,
      expires_at: expiresAt.toISOString(),
      name,
      password_hash: passwordHash,
    });

    await sendOtpEmail(email, otp);

    res.json({ message: "OTP sent to your email", email: email.toLowerCase() });
  } catch (err) {
    console.error("REGISTER_ERROR", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Registration failed",
    });
  }
});

// POST /api/auth/verify-otp — create account + start trial
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const { data: record } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("is_used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!record) return res.status(400).json({ error: "Invalid OTP, try again" });
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: "OTP has expired. Please register again." });
    }
    if (record.otp_code !== otp) {
      return res.status(400).json({ error: "Invalid OTP, try again" });
    }

    await supabase.from("otp_verifications").update({ is_used: true }).eq("id", record.id);

    const { data: user, error } = await supabase
      .from("users")
      .insert({
        name: record.name,
        email: email.toLowerCase(),
        password_hash: record.password_hash,
        role: "user",
      })
      .select()
      .single();
    if (error) throw error;

    await createTrialSubscription(user.id);
    await createNotification(
      user.id,
      "Welcome! Your 3-day free trial has started.",
      "success"
    );

    setAuthCookies(res, user.id, user.email, "user");

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("VERIFY_OTP_ERROR", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Verification failed",
    });
  }
});

// POST /api/auth/resend-otp
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const { data: record } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("is_used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!record) return res.status(400).json({ error: "No pending registration found" });

    const elapsed = (Date.now() - new Date(record.created_at).getTime()) / 1000;
    if (elapsed < config.otpResendCooldown) {
      return res.status(429).json({
        error: "Please wait before resending",
        cooldown: Math.ceil(config.otpResendCooldown - elapsed),
      });
    }

    const otp = generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + config.otpExpiryMinutes);

    await supabase.from("otp_verifications").update({ is_used: true }).eq("id", record.id);
    await supabase.from("otp_verifications").insert({
      email: email.toLowerCase(),
      otp_code: otp,
      expires_at: expiresAt.toISOString(),
      name: record.name,
      password_hash: record.password_hash,
    });

    await sendOtpEmail(email, otp);
    res.json({ message: "OTP resent", cooldown: config.otpResendCooldown });
  } catch (err) {
    console.error("RESEND_OTP_ERROR", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Resend failed",
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("role", "user")
      .maybeSingle();

    if (!user || !user.is_active) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    setAuthCookies(res, user.id, user.email, "user");
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/admin/login
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("role", "admin")
      .maybeSingle();

    if (!user) return res.status(401).json({ error: "Invalid admin credentials" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid admin credentials" });

    setAuthCookies(res, user.id, user.email, "admin");
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Admin login failed" });
  }
});

// POST /api/auth/logout
router.post("/logout", (_req, res) => {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });
  res.json({ message: "Logged out" });
});

// POST /api/auth/refresh
router.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: "No refresh token" });

    const payload = verifyRefreshToken(token);
    setAuthCookies(res, payload.userId, payload.email, payload.role);
    res.json({ message: "Token refreshed" });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req: AuthRequest, res) => {
  const { data: user } = await supabase
    .from("users")
    .select("id, name, email, role, is_active, created_at")
    .eq("id", req.user!.userId)
    .single();

  if (!user || !user.is_active) {
    return res.status(401).json({ error: "Account deactivated" });
  }

  res.json({ user });
});

export default router;
