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

type Step = "plans" | "payment" | "confirm";

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
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getPlans().then((d) => setPlans(d.plans));
  }, []);

  const amount = PLAN_AMOUNTS[selectedPlan] || 0;
  const selectedAppObj = PAYMENT_APPS.find((a) => a.id === selectedApp);
  const selectedPaymentMethod = selectedApp === "card" ? "Card / Debit" : selectedAppObj?.name || "Payment";
  const qrValue = selectedAppObj?.deepLink 
    ? selectedAppObj.deepLink(amount) 
    : `03099716270`;

  const handlePayNow = () => {
    if (!selectedPlan || !name || !email || !phone) {
      toast("Please fill all fields and select a plan", "error");
      return;
    }
    setStep("payment");
  };

  const handleJazzCashCheckout = async () => {
    setRedirecting(true);
    try {
      const { url, payload } = await api.initiateJazzCashPayment(selectedPlan);
      
      // Create hidden form for JazzCash POST
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
  };

  const handleManualPayment = async (appId: string) => {
    const app = PAYMENT_APPS.find((a) => a.id === appId);
    setSelectedApp(appId);

    if (appId === "card") {
      setShowQr(false);
      setStep("confirm");
      return;
    }

    if (!app) return;
    setRedirecting(true);

    if (app.deepLink) {
      window.location.href = app.deepLink(amount);
    } else {
      window.open(app.playStore, "_blank");
    }

    setTimeout(() => {
      setRedirecting(false);
      setShowQr(true);
      setStep("confirm");
    }, 2500);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    const isCard = selectedApp === "card";
    const cardDigits = cardNumber.replace(/\D/g, "");
    const cardExpiryMatch = cardExpiry.match(/^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/);

    if (isCard) {
      if (!cardHolder.trim()) {
        toast("Name on card is required", "error");
        return;
      }
      if (cardDigits.length < 13 || cardDigits.length > 19) {
        toast("Please enter a valid card number", "error");
        return;
      }
      if (!cardExpiryMatch) {
        toast("Please enter a valid expiry date (MM/YY)", "error");
        return;
      }
      if (!/^[0-9]{3,4}$/.test(cardCvv)) {
        toast("Please enter a valid CVV", "error");
        return;
      }
      const last4 = cardDigits.slice(-4);
      setCardLast4(last4);
    } else {
      if (!transactionId) {
        toast("Transaction ID is required", "error");
        return;
      }
      if (!screenshot) {
        toast("Screenshot is required", "error");
        return;
      }
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("plan", selectedPlan);
      if (transactionId) fd.append("transactionId", transactionId);
      fd.append("paymentMethod", selectedApp || "card");
      fd.append("cardHolder", cardHolder);
      fd.append("cardLast4", cardLast4 || cardNumber.slice(-4));
      fd.append("cardExpiry", cardExpiry);
      if (screenshot) fd.append("screenshot", screenshot);
      const response = await api.submitPayment(fd);
      toast(response.message || "Payment submitted successfully.", "success");
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

        {/* Step 2: Payment Method Selection */}
        {step === "payment" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl border border-violet-500/20 bg-gradient-to-br from-[#0b1120] to-[#1a1f3a] p-8">
              <h2 className="text-2xl font-bold text-center mb-2 text-white">Complete Payment</h2>
              <p className="text-center text-slate-400 mb-2">Plan: <span className="text-violet-300 font-semibold">{plans.find(p => p.id === selectedPlan)?.name}</span></p>
              <p className="text-center text-lg font-bold text-violet-300 mb-8">
                {amount.toLocaleString()} PKR (~${PLAN_AMOUNTS[selectedPlan] / 1000 * 82 | 0})
              </p>

              {redirecting ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="h-12 w-12 animate-spin rounded-full border-3 border-violet-500 border-t-transparent mb-4" />
                  <p className="text-slate-300 font-medium">Processing your payment...</p>
                  <p className="text-slate-500 text-sm mt-2">You'll be redirected to JazzCash in moments</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* JazzCash Primary Button */}
                  <button
                    onClick={handleJazzCashCheckout}
                    className="w-full group relative rounded-2xl border-2 border-violet-500 bg-gradient-to-r from-violet-600/20 to-violet-500/20 p-6 hover:from-violet-600/30 hover:to-violet-500/30 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-violet-400 opacity-0 group-hover:opacity-5 transition-opacity" />
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                          <span className="text-2xl">💳</span>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-lg text-white">JazzCash Hosted Checkout</p>
                          <p className="text-sm text-slate-400">Secure payment gateway • Instant confirmation</p>
                        </div>
                      </div>
                      <div className="text-2xl">→</div>
                    </div>
                  </button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-[#0b1120] px-3 text-xs text-slate-500">OR</span>
                    </div>
                  </div>

                  {/* Alternative Methods */}
                  <div className="grid grid-cols-2 gap-3">
                    {PAYMENT_APPS.filter(a => a.id !== "jazzcash").map((app) => (
                      <button
                        key={app.id}
                        onClick={() => handleManualPayment(app.id)}
                        className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-slate-400 hover:bg-white/5 transition-all active:scale-95"
                      >
                        <div className="h-10 w-10 flex items-center justify-center">
                          {app.logo}
                        </div>
                        <span className="text-xs font-medium text-center">{app.name}</span>
                      </button>
                    ))}
                    <button
                      key="card"
                      onClick={() => handleManualPayment("card")}
                      className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-slate-400 hover:bg-white/5 transition-all active:scale-95"
                    >
                      <div className="h-10 w-10 flex items-center justify-center text-2xl">💳</div>
                      <span className="text-xs font-medium text-center">Card / Debit</span>
                    </button>
                  </div>

                  <Button 
                    variant="ghost" 
                    className="w-full mt-6" 
                    onClick={() => setStep("plans")}
                  >
                    ← Back to Plans
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Confirm Payment */}
        {step === "confirm" && (
          <div className="space-y-6">
            {selectedApp !== "card" ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="font-bold text-lg text-violet-300 mb-2">Confirm payment for {selectedPaymentMethod}</h3>
                <p className="text-sm text-slate-400 mb-4">Upload transaction details to complete your subscription. Auto approval is enabled for JazzCash, EasyPaisa, and Card.</p>
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
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="font-bold text-lg text-violet-300 mb-2">Card payment details</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Enter only the last 4 digits and card holder name for verification. Your subscription will be auto-approved after submission.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 text-sm text-slate-300">
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Payment Method</p>
                    <p className="font-semibold text-white">Card / Debit</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Plan Amount</p>
                    <p className="font-semibold text-white">{amount.toLocaleString()} PKR</p>
                  </div>
                </div>
              </div>
            )}

            {showQr && selectedApp !== "card" && (
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
                {selectedApp !== "card" && (
                  <div>
                    <Label>Transaction ID / Reference Number</Label>
                    <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} required placeholder="e.g. T1234567890" />
                  </div>
                )}
                {selectedApp === "card" && (
                  <div className="space-y-4">
                    <div>
                      <Label>Card Number</Label>
                      <Input
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        inputMode="numeric"
                        required
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Expiration Date</Label>
                        <Input
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          inputMode="numeric"
                          required
                        />
                      </div>
                      <div>
                        <Label>CVV</Label>
                        <Input
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="123"
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Name on Card</Label>
                      <Input
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="As shown on card"
                        required
                      />
                    </div>
                  </div>
                )}
                {selectedApp !== "card" && (
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
                )}
                <Button type="submit" loading={submitting} className="w-full">
                  Submit Payment {selectedApp === "card" ? "Details" : "Proof"}
                </Button>
              </form>
              <p className="text-xs text-slate-500 mt-3 text-center">
                {selectedApp === "card"
                  ? "Your card payment submission will be auto-approved."
                  : "Status will become \"Pending Admin Approval\" after submission."}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
