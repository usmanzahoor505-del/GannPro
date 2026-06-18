import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, Plan } from "@/lib/api";
import { PLAN_AMOUNTS } from "@/lib/plans";
import { Navbar } from "@/components/layout/Navbar";
import { TrialBanner } from "@/components/layout/TrialBanner";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

type Step = "plans" | "payment" | "confirm";
type PaymentMethod = "jazzcash" | "easypaisa" | "bank";

const AppLogo = ({ name, file }: { name: string; file: string }) => (
  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white flex items-center justify-center p-1.5 shrink-0">
    <img
      src={`/logos/${file}`}
      alt={name}
      className="w-full h-full object-contain"
    />
  </div>
);

const PAYMENT_METHODS = [
  {
    id: "jazzcash" as PaymentMethod,
    name: "JazzCash",
    logoFile: "lg-691c164eec616-JazzCash.webp",
    color: "from-red-600/20 to-red-500/10",
    border: "border-red-500/40",
    hoverBorder: "hover:border-red-400",
    textColor: "text-red-400",
    desc: "Transfer to JazzCash account",
  },
  {
    id: "easypaisa" as PaymentMethod,
    name: "EasyPaisa",
    logoFile: "lg-691c1186e198d-easypaisa.webp",
    color: "from-emerald-600/20 to-emerald-500/10",
    border: "border-emerald-500/40",
    hoverBorder: "hover:border-emerald-400",
    textColor: "text-emerald-400",
    desc: "Transfer to EasyPaisa account",
  },
  {
    id: "bank" as PaymentMethod,
    name: "Bank Transfer",
    logoFile: "lg-67a9cfc4acfce-Meezan-Bank.webp",
    color: "from-blue-600/20 to-blue-500/10",
    border: "border-blue-500/40",
    hoverBorder: "hover:border-blue-400",
    textColor: "text-blue-400",
    desc: "Direct bank transfer (IBAN)",
  },
];

// Account credentials shown to users
const ACCOUNT_DETAILS = {
  jazzcashNumber: "03099716270",
  iban: "PK82JCMA3005921099716270",
  accountTitle: "Arbaz Salman",
  bankName: "JazzCash (Mobilink Microfinance Bank)",
};

export function SubscribePage() {
  const { user, subscription } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const initialPlan = searchParams.get("plan") || "";

  const [plans, setPlans] = useState<Plan[]>([]);
  const [step, setStep] = useState<Step>("plans");
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  // Proof fields
  const [transactionId, setTransactionId] = useState("");
  const [senderBankName, setSenderBankName] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getPlans().then((d) => setPlans(d.plans));
  }, []);

  const amount = PLAN_AMOUNTS[selectedPlan] || 0;
  const methodObj = PAYMENT_METHODS.find((m) => m.id === selectedMethod);

  const handlePayNow = () => {
    if (!selectedPlan || !name || !email || !phone) {
      toast("Please fill all fields and select a plan", "error");
      return;
    }
    setStep("payment");
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setStep("confirm");
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transactionId.trim()) {
      toast("Please enter your Transaction ID", "error");
      return;
    }
    if (!screenshot) {
      toast("Payment screenshot is required", "error");
      return;
    }
    if (selectedMethod === "bank" && !senderBankName.trim()) {
      toast("Please enter your Bank Name", "error");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("plan", selectedPlan);
      fd.append("transactionId", transactionId.trim());
      fd.append("paymentMethod", selectedMethod || "jazzcash");
      fd.append("screenshot", screenshot);
      if (selectedMethod === "bank") {
        fd.append("senderBankName", senderBankName.trim());
      }

      const response = await api.submitPayment(fd);
      toast(response.message || "Payment submitted successfully. Awaiting admin approval.", "success");
      window.location.href = "/dashboard";
    } catch (err) {
      toast(err instanceof Error ? err.message : "Submission failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070f] text-white overflow-x-hidden">
      <Navbar />
      <TrialBanner />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Subscribe to GannPro9</h1>
        <p className="text-slate-500 text-sm mb-8">
          Select a plan and submit payment proof
        </p>

        {/* Active Subscription Check */}
        {subscription?.status === "active" ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl">
              ✅
            </div>
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">Active Subscription</h2>
            <p className="text-slate-300">
              You already have an active{" "}
              <span className="font-semibold text-white">{subscription.planName}</span> plan.
            </p>
            <p className="text-slate-400 mt-2 text-sm">
              Your current subscription expires in{" "}
              <span className="font-medium text-amber-400">{subscription.daysRemaining} days</span>.
            </p>
            <Button className="mt-6 px-8" onClick={() => (window.location.href = "/dashboard")}>
              Return to Dashboard
            </Button>
          </div>
        ) : (
          <>
            {/* ── Step 1: Plans + Form ── */}
            {step === "plans" && (
              <div className="space-y-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
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
                      <p className="text-xs text-slate-500 mt-2">
                        {plan.months} Month{plan.months > 1 ? "s" : ""} access
                      </p>
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
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="03XX XXXXXXX"
                      required
                    />
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
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    onClick={handlePayNow}
                    className="w-full text-base py-3 animate-pulse hover:animate-none"
                  >
                    PAY NOW
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 2: Payment Method Selection ── */}
            {step === "payment" && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
                <div className="w-full max-w-xl rounded-2xl border border-violet-500/20 bg-gradient-to-br from-[#0b1120] to-[#161a30] p-5 sm:p-8 my-auto">
                  <h2 className="text-2xl font-bold text-center mb-1 text-white">
                    Payment Method
                  </h2>
                  <p className="text-center text-slate-400 mb-1 text-sm">
                    Plan:{" "}
                    <span className="text-violet-300 font-semibold">
                      {plans.find((p) => p.id === selectedPlan)?.name}
                    </span>
                  </p>
                  <p className="text-center text-xl font-bold text-violet-300 mb-6">
                    {amount.toLocaleString()} PKR
                  </p>

                  <div className="space-y-3">
                    {PAYMENT_METHODS.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => handleSelectMethod(method.id)}
                        className={`w-full group relative rounded-2xl border-2 bg-gradient-to-r ${method.color} ${method.border} ${method.hoverBorder} p-5 transition-all duration-300 text-left`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3.5">
                            <AppLogo name={method.name} file={method.logoFile} />
                            <div>
                              <p className={`font-bold text-base text-white`}>{method.name}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{method.desc}</p>
                            </div>
                          </div>
                          <div className={`text-xl ${method.textColor} group-hover:translate-x-1 transition-transform`}>
                            →
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Note */}
                  <div className="mt-5 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
                    <p className="text-xs text-amber-400 text-center font-sans">
                      ⏳ Submit payment screenshot and Transaction ID — Admin will verify in 2-4 hours
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full mt-4 text-sm text-slate-400"
                    onClick={() => setStep("plans")}
                  >
                    ← Back to Plans
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 3: Confirm / Submit Proof ── */}
            {step === "confirm" && methodObj && (
              <div className="space-y-6 animate-fadeIn">
                {/* Account Details Card */}
                <div
                  className={`rounded-2xl border bg-gradient-to-r ${methodObj.color} ${methodObj.border} p-6`}
                >
                  <div className="flex items-center gap-3.5 mb-4">
                    <AppLogo name={methodObj.name} file={methodObj.logoFile} />
                    <div>
                      <h3 className={`font-bold text-xl ${methodObj.textColor}`}>
                        {methodObj.name} Payment Details
                      </h3>
                      <p className="text-sm text-slate-400 mt-0.5">
                        Please transfer{" "}
                        <span className="text-white font-semibold">
                          {amount.toLocaleString()} PKR
                        </span>{" "}
                        to the account details below
                      </p>
                    </div>
                  </div>

                  {/* Credentials grid */}
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                    {/* JazzCash number */}
                    <div className="rounded-xl bg-white/[0.04] border border-white/8 p-4">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                        JazzCash Number
                      </p>
                      <p className="font-mono font-bold text-white text-lg">
                        {ACCOUNT_DETAILS.jazzcashNumber}
                      </p>
                    </div>

                    {/* IBAN */}
                    <div className="rounded-xl bg-white/[0.04] border border-white/8 p-4">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                        IBAN (JazzCash)
                      </p>
                      <p className="font-mono font-bold text-white text-xs break-all">
                        {ACCOUNT_DETAILS.iban}
                      </p>
                    </div>

                    {/* Account Title */}
                    <div className="rounded-xl bg-white/[0.04] border border-white/8 p-4">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                        Account Title / Bank
                      </p>
                      <p className="font-semibold text-white text-sm">
                        {ACCOUNT_DETAILS.accountTitle}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{ACCOUNT_DETAILS.bankName}</p>
                    </div>
                  </div>

                  {/* Amount highlight */}
                  <div className="mt-3 rounded-xl bg-white/[0.06] border border-white/10 p-3 text-center">
                    <p className="text-xs text-slate-400">Transfer Amount</p>
                    <p className={`text-2xl font-black ${methodObj.textColor} mt-1`}>
                      {amount.toLocaleString()} PKR
                    </p>
                  </div>
                </div>

                {/* Proof Submission Form */}
                <form
                  onSubmit={handleSubmitProof}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-5"
                >
                  <h3 className="font-bold text-lg text-white">Submit Payment Proof</h3>

                  {/* Transaction ID */}
                  <div>
                    <Label>Transaction ID / Reference Number</Label>
                    <Input
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="e.g. JC-1234567890 or TID-XXXXXXX"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      You can find the Transaction ID in your payment receipt
                    </p>
                  </div>

                  {/* Bank Name ── only for Bank Transfer */}
                  {selectedMethod === "bank" && (
                    <div>
                      <Label>Your Bank Name</Label>
                      <Input
                        value={senderBankName}
                        onChange={(e) => setSenderBankName(e.target.value)}
                        placeholder="e.g. HBL, Meezan Bank, UBL, MCB..."
                        required
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Enter the name of the bank you transferred money from
                      </p>
                    </div>
                  )}

                  {/* Screenshot Upload */}
                  <div>
                    <Label>Payment Screenshot</Label>
                    <div className="mt-1 rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] p-6 text-center hover:border-violet-500/40 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        id="screenshot-upload"
                        onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                        className="hidden"
                        required
                      />
                      <label
                        htmlFor="screenshot-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        {screenshot ? (
                          <>
                            <span className="text-3xl">✅</span>
                            <p className="text-sm text-emerald-400 font-medium">{screenshot.name}</p>
                            <p className="text-xs text-slate-500">
                              {(screenshot.size / 1024).toFixed(1)} KB — click to change
                            </p>
                          </>
                        ) : (
                          <>
                            <span className="text-3xl">📷</span>
                            <p className="text-sm text-slate-300 font-medium">
                              Choose Screenshot
                            </p>
                            <p className="text-xs text-slate-500">
                              Payment receipt or transaction confirmation screenshot
                            </p>
                            <span className="mt-2 rounded-lg bg-violet-600/20 border border-violet-500/30 px-4 py-1.5 text-xs text-violet-300 font-medium">
                              📁 Browse File
                            </span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    loading={submitting}
                    className="w-full text-base py-3 font-semibold rounded-xl"
                  >
                    ✅ Submit Payment Proof
                  </Button>

                  <p className="text-xs text-slate-500 text-center font-sans">
                    ⏳ Admin will verify and activate your subscription within 2-4 hours
                  </p>
                </form>

                {/* Back button */}
                <div className="flex items-center justify-between mt-2">
                  <Button
                    variant="ghost"
                    className="text-sm text-slate-400"
                    onClick={() => {
                      setStep("payment");
                      setTransactionId("");
                      setSenderBankName("");
                      setScreenshot(null);
                    }}
                  >
                    ← Change Payment Method
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
