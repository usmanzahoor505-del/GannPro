import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { AuthLayout } from "./LoginPage";

export function RegisterPage() {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { setUser, refreshSubscription } = useAuth();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.register({ name, email, password });
      toast("OTP sent to your email", "success");
      setStep("otp");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await api.verifyOtp({ email, otp });
      setUser(user);
      await refreshSubscription();
      toast("Account created! Your 3-day free trial has started.", "success");
      window.location.href = "/dashboard";
    } catch (err) {
      toast(err instanceof Error ? err.message : "Invalid OTP, try again", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      const res = await api.resendOtp(email);
      toast("OTP resent to your email", "success");
      setCooldown(res.cooldown);
      const timer = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Resend failed", "error");
    }
  };

  if (step === "otp") {
    return (
      <AuthLayout title="Verify Email" subtitle={`Enter the 6-digit code sent to ${email}`}>
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <Label>Verification Code</Label>
            <Input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              maxLength={6}
              placeholder="000000"
              className="text-center text-2xl tracking-[0.5em] font-bold"
            />
          </div>
          <Button type="submit" loading={loading} className="w-full">Verify & Create Account</Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={cooldown > 0}
            onClick={handleResend}
          >
            {cooldown > 0 ? `Resend OTP (${cooldown}s)` : "Resend OTP"}
          </Button>
        </form>
        <button onClick={() => setStep("form")} className="mt-4 w-full text-center text-sm text-slate-500 hover:text-slate-300">
          ← Back to registration
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create Account" subtitle="Start your 3-day free trial">
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <Label>Full Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe" />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@email.com" />
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" />
        </div>
        <Button type="submit" loading={loading} className="w-full">Register</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account? <Link to="/login" className="text-violet-400 hover:text-violet-300">Sign In</Link>
      </p>
    </AuthLayout>
  );
}
