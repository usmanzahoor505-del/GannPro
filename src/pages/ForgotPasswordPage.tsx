import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { AuthLayout } from "./LoginPage";

export function ForgotPasswordPage() {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.forgotPasswordRequest({ email, newPassword });
      toast("Verification code sent to your email", "success");
      setStep("otp");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Request failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.forgotPasswordVerify({ email, otp });
      toast("Password reset successfully! You can now log in.", "success");
      navigate("/login");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Invalid code, try again", "error");
    } finally {
      setLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <AuthLayout title="Reset Password" subtitle={`Enter the 6-digit code sent to ${email}`}>
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
          <Button type="submit" loading={loading} className="w-full">Verify & Reset Password</Button>
        </form>
        <button onClick={() => setStep("form")} className="mt-4 w-full text-center text-sm text-slate-500 hover:text-slate-300">
          ← Back to email form
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your email and a new password">
      <form onSubmit={handleRequest} className="space-y-4">
        <div>
          <Label>Email Address</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@email.com" />
        </div>
        <div>
          <Label>New Password</Label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" />
        </div>
        <Button type="submit" loading={loading} className="w-full">Send Reset Code</Button>
      </form>
      <div className="mt-6 text-center text-sm">
        <Link to="/login" className="text-violet-400 hover:text-violet-300">Back to Sign In</Link>
      </div>
    </AuthLayout>
  );
}
