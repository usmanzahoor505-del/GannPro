import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { api, Plan } from "@/lib/api";
import { PAYMENT_APPS, PLAN_AMOUNTS } from "@/lib/plans";
import { Navbar } from "@/components/layout/Navbar";
import { TrialBanner } from "@/components/layout/TrialBanner";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

type Step = "plans" | "apps" | "confirm";

export function SubscribePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [step, setStep] = useState<Step>("plans");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getPlans().then((d) => setPlans(d.plans));
  }, []);

  const amount = PLAN_AMOUNTS[selectedPlan] || 0;
  const selectedAppObj = PAYMENT_APPS.find((a) => a.id === selectedApp);
  const qrValue = selectedAppObj?.deepLink 
    ? selectedAppObj.deepLink(amount) 
    : `03099716270`;

  const handlePayNow = () => {
    if (!selectedPlan || !name || !email || !phone) {
      toast("Please fill all fields and select a plan", "error");
      return;
    }
    setStep("apps");
  };

  const handleAppSelect = async (appId: string) => {
    const app = PAYMENT_APPS.find((a) => a.id === appId);
    if (!app) return;
    setSelectedApp(appId);
    setRedirecting(true);

    // 💳 Automated JazzCash Hosted Checkout
    if (appId === "jazzcash") {
      try {
        const { url, payload } = await api.initiateJazzCashPayment(selectedPlan);

        // Create a hidden form and POST to JazzCash checkout
        const form = document.createElement("form");
        form.method = "POST";
        form.action = url;

        Object.entries(payload).forEach(([key, val]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = val as string;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } catch (err: any) {
        toast(err.message || "Failed to initiate JazzCash payment", "error");
        setRedirecting(false);
      }
      return;
    }

    if (app.deepLink) {
      window.location.href = app.deepLink(amount);
      setTimeout(() => {
        setRedirecting(false);
        setShowQr(true);
        setStep("confirm");
      }, 2500);
    } else {
      window.open(app.playStore, "_blank");
      setRedirecting(false);
      setShowQr(true);
      setStep("confirm");
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId || !screenshot) {
      toast("Transaction ID and screenshot are required", "error");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("plan", selectedPlan);
      fd.append("transactionId", transactionId);
      fd.append("screenshot", screenshot);
      await api.submitPayment(fd);
      toast("Payment submitted! Awaiting admin approval.", "success");
      window.location.href = "/dashboard";
    } catch (err) {
      toast(err instanceof Error ? err.message : "Submission failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070f] text-white">
      <Navbar />
      <TrialBanner />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Subscribe to GannPro9</h1>
        <p className="text-slate-500 text-sm mb-8">Choose a plan and complete payment via your preferred app</p>

        {/* Step 1: Plans + Form */}
        {step === "plans" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`rounded-2xl border p-5 text-left transition-all ${
                    selectedPlan === plan.id
                      ? "border-violet-500/50 bg-violet-500/10 ring-2 ring-violet-500/30"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20"
                  }`}
                >
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <p className="text-2xl font-black text-violet-300 mt-2">${plan.usd}</p>
                  <p className="text-sm text-slate-400">{plan.pkr.toLocaleString()} PKR</p>
                  <p className="text-xs text-slate-500 mt-2">{plan.months} Month{plan.months > 1 ? "s" : ""} access</p>
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03XX XXXXXXX" required />
              </div>
              <div>
                <Label>Selected Plan</Label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full rounded-xl bg-[#0b1120] border border-white/10 px-3.5 py-2.5 text-sm text-white outline-none"
                >
                  <option value="">Select a plan...</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
              <Button onClick={handlePayNow} className="w-full text-base py-3">PAY NOW</Button>
            </div>
          </div>
        )}

        {/* Step 2: App Selection Modal */}
        {step === "apps" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b1120] p-6">
              <h2 className="text-xl font-bold text-center mb-2">Choose Payment App</h2>
              <p className="text-center text-sm text-slate-400 mb-6">
                Amount: <strong className="text-violet-300">{amount.toLocaleString()} PKR</strong>
              </p>
              {redirecting ? (
                <div className="flex flex-col items-center py-12">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                  <p className="mt-4 text-sm text-slate-400">Opening payment app...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {PAYMENT_APPS.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => handleAppSelect(app.id)}
                      className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all active:scale-95"
                    >
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl">
                        {app.logo}
                      </div>
                      <span className="text-sm font-medium">{app.name}</span>
                    </button>
                  ))}
                </div>
              )}
              <Button variant="ghost" className="w-full mt-4" onClick={() => setStep("plans")}>← Back</Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm Payment */}
        {step === "confirm" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="font-bold text-lg text-violet-300 mb-4">Bank Transfer Details</h3>
              <div className="grid gap-4 sm:grid-cols-3 text-sm text-slate-300">
                <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Account Number</p>
                  <p className="font-mono font-semibold text-white text-base">01099716270</p>
                </div>
                <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">IBAN</p>
                  <p className="font-mono font-semibold text-white text-xs break-all">PK82JCMA3005921099716270</p>
                </div>
                <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">JazzCash</p>
                  <p className="font-mono font-semibold text-white text-base">03099716270</p>
                </div>
              </div>
            </div>

            {showQr && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
                <p className="text-sm text-slate-400 mb-4">App not opening? Scan QR code instead</p>
                <div className="inline-block rounded-2xl bg-white p-4">
                  <QRCodeSVG value={qrValue} size={256} />
                </div>
                <p className="text-xs text-slate-500 mt-3">QR regenerates based on selected plan ({amount.toLocaleString()} PKR)</p>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-bold mb-4">Confirm Your Payment</h2>
              <form onSubmit={handleSubmitProof} className="space-y-4">
                <div>
                  <Label>Transaction ID / Reference Number</Label>
                  <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} required placeholder="e.g. T1234567890" />
                </div>
                <div>
                  <Label>Payment Screenshot</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                    className="w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:text-sm file:text-white"
                    required
                  />
                </div>
                <Button type="submit" loading={submitting} className="w-full">
                  Submit Payment Proof
                </Button>
              </form>
              <p className="text-xs text-slate-500 mt-3 text-center">
                Status will become "Pending Admin Approval" after submission
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
