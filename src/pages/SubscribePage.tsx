import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

  const handleManualPayment = async (appId: string) => {
    if (appId === "card") {
      setSelectedApp("card");
      setStep("confirm");
      return;
    }

    if (appId === "jazzcash") {
      setSelectedApp("jazzcash");
      setStep("confirm");
      return;
    }

    const app = PAYMENT_APPS.find((a) => a.id === appId);
    if (!app) return;
    setSelectedApp(appId);
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
    const isJazzCash = selectedApp === "jazzcash";
    const isEasyPaisa = selectedApp === "easypaisa";

    if (isJazzCash) {
      const cleanedPhone = phone.replace(/\s/g, "");
      if (!cleanedPhone || !/^03[0-9]{9}$/.test(cleanedPhone)) {
        toast("Please enter a valid JazzCash mobile number (e.g. 03001234567)", "error");
        return;
      }

      setSubmitting(true);
      try {
        const response = await api.payWithDirectWallet(selectedPlan, cleanedPhone);
        toast(response.message || "Payment approved successfully!", "success");
        window.location.href = "/dashboard";
      } catch (err: any) {
        toast(err.message || "JazzCash payment failed. Please try again.", "error");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (isCard) {
      const cardDigits = cardNumber.replace(/\D/g, "");
      const cardExpiryMatch = cardExpiry.match(/^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/);

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

      setSubmitting(true);
      try {
        const response = await api.payWithDirectCard(selectedPlan, {
          cardNumber: cardDigits,
          cardExpiry: cardExpiry,
          cardCvv: cardCvv,
          cardHolder: cardHolder.trim(),
        });
        toast(response.message || "Card charged successfully!", "success");
        window.location.href = "/dashboard";
      } catch (err: any) {
        toast(err.message || "Card payment failed. Please try again.", "error");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Manual upload methods (EasyPaisa or others)
    if (!transactionId) {
      toast("Transaction ID is required", "error");
      return;
    }
    if (!isEasyPaisa && !screenshot) {
      toast("Screenshot is required", "error");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("plan", selectedPlan);
      if (transactionId) fd.append("transactionId", transactionId);
      fd.append("paymentMethod", selectedApp || "easypaisa");
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
    <div className="min-h-screen bg-[#05070f] text-white overflow-x-hidden">
      <Navbar />
      <TrialBanner />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Subscribe to GannPro9</h1>
        <p className="text-slate-500 text-sm mb-8">Choose a plan and complete payment via your preferred app</p>

        {/* Active Subscription Check */}
        {subscription?.status === "active" ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl">
              ✅
            </div>
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">Active Subscription</h2>
            <p className="text-slate-300">
              You already have an active <span className="font-semibold text-white">{subscription.planName}</span> plan.
            </p>
            <p className="text-slate-400 mt-2 text-sm">
              Your current subscription expires in <span className="font-medium text-amber-400">{subscription.daysRemaining} days</span>. You cannot purchase a new plan until your current one expires.
            </p>
            <Button className="mt-6 px-8" onClick={() => window.location.href = "/dashboard"}>
              Return to Dashboard
            </Button>
          </div>
        ) : (
          /* Step 1: Plans + Form */
          step === "plans" && (
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
                <Button onClick={handlePayNow} className="w-full text-base py-3 animate-pulse hover:animate-none">PAY NOW</Button>
              </div>
            </div>
          )
        )}

        {/* Step 2: Payment Method Selection */}
        {step === "payment" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-xl rounded-2xl border border-violet-500/20 bg-gradient-to-br from-[#0b1120] to-[#161a30] p-5 sm:p-8 my-auto">
              <h2 className="text-2xl font-bold text-center mb-2 text-white">Complete Payment</h2>
              <p className="text-center text-slate-400 mb-2">
                Plan: <span className="text-violet-300 font-semibold">{plans.find(p => p.id === selectedPlan)?.name}</span>
              </p>
              <p className="text-center text-lg font-bold text-violet-300 mb-6">
                {amount.toLocaleString()} PKR
              </p>

              {redirecting ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="h-12 w-12 animate-spin rounded-full border-3 border-violet-500 border-t-transparent mb-4" />
                  <p className="text-slate-300 font-medium font-sans">Processing your payment...</p>
                  <p className="text-slate-500 text-sm mt-2">You'll be redirected in moments</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* JazzCash Wallet (Primary Auto-Approve Option) */}
                  <button
                    onClick={() => handleManualPayment("jazzcash")}
                    className="w-full group relative rounded-2xl border-2 border-violet-500 bg-gradient-to-r from-violet-600/20 to-violet-500/10 p-5 hover:from-violet-600/30 hover:to-violet-500/20 transition-all duration-300 overflow-hidden text-left"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-violet-400 opacity-0 group-hover:opacity-5 transition-opacity" />
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="h-12 w-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-2xl">
                          📱
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-base text-white">JazzCash Wallet</p>
                            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                              Instant Auto-Approve
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">Pay via wallet push MPIN prompt • No screenshot required</p>
                        </div>
                      </div>
                      <div className="text-xl text-violet-300 group-hover:translate-x-1 transition-transform">→</div>
                    </div>
                  </button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-[#0c1222] px-3 text-[10px] uppercase tracking-wider text-slate-500">Other Payment Methods</span>
                    </div>
                  </div>

                  {/* Alternative Methods */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => handleManualPayment("card")}
                      className="flex items-center gap-3 rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-600/10 to-violet-500/5 p-4 hover:border-violet-400 hover:bg-violet-600/20 transition-all active:scale-98 text-left"
                    >
                      <div className="h-10 w-10 flex items-center justify-center text-xl bg-white/5 rounded-lg">💳</div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-white">Card / Debit</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 block font-medium">Auto-Approve</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleManualPayment("easypaisa")}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-slate-500 hover:bg-white/5 transition-all active:scale-98 text-left"
                    >
                      <div className="h-10 w-10 flex items-center justify-center bg-white/5 rounded-lg">
                        <span className="text-xs font-bold text-[#00A651]">EP</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white">EasyPaisa</span>
                        <span className="text-[10px] text-amber-500 block font-medium">Manual Review</span>
                      </div>
                    </button>
                  </div>

                  <Button 
                    variant="ghost" 
                    className="w-full mt-6 text-sm text-slate-400" 
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
          <div className="space-y-6 animate-fadeIn">
            {selectedApp === "jazzcash" && (
              <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-600/10 to-violet-500/5 p-6 border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <div>
                    <h3 className="font-bold text-xl text-violet-300">JazzCash Wallet Checkout</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Enter your mobile number. You'll receive a secure MPIN authorization request on your phone.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20 self-start sm:self-center">
                    ⚡ Auto Approved
                  </span>
                </div>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 text-sm text-slate-300">
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Payment Method</p>
                    <p className="font-semibold text-white">JazzCash Mobile Wallet</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Plan Amount</p>
                    <p className="font-semibold text-white">{amount.toLocaleString()} PKR</p>
                  </div>
                </div>
              </div>
            )}

            {selectedApp === "card" && (
              <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-600/10 to-violet-500/5 p-6 border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                  <div>
                    <h3 className="font-bold text-xl text-violet-300">Credit / Debit Card Checkout</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Enter card details to pay securely via JazzCash Card merchant gateway.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20 self-start sm:self-center">
                    ⚡ Auto Approved
                  </span>
                </div>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 text-sm text-slate-300">
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Payment Method</p>
                    <p className="font-semibold text-white">Credit / Debit Card (Visa/Mastercard)</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Plan Amount</p>
                    <p className="font-semibold text-white">{amount.toLocaleString()} PKR</p>
                  </div>
                </div>
              </div>
            )}

            {selectedApp !== "jazzcash" && selectedApp !== "card" && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-violet-300">Confirm payment for {selectedPaymentMethod}</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Please send payment to the account details below and submit your receipt.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 ring-1 ring-inset ring-amber-500/20 self-start sm:self-center font-semibold">
                    ⏳ Admin Approval Required
                  </span>
                </div>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 text-sm text-slate-300">
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Account Number</p>
                    <p className="font-mono font-semibold text-white text-base">01099716270</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">IBAN</p>
                    <p className="font-mono font-semibold text-white text-xs break-all">PK82JCMA3005921099716270</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">JazzCash Number</p>
                    <p className="font-mono font-semibold text-white text-base">03099716270</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitProof} className="space-y-6">
              {showQr && selectedApp !== "card" && selectedApp !== "jazzcash" && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
                  <p className="text-sm text-slate-400 mb-4">App not opening? Scan QR code instead</p>
                  <div className="inline-block rounded-2xl bg-white p-3 sm:p-4">
                    <QRCodeSVG value={qrValue} size={200} className="sm:w-[256px] sm:h-[256px]" />
                  </div>
                  <p className="text-xs text-slate-500 mt-3">QR regenerates based on selected plan ({amount.toLocaleString()} PKR)</p>
                </div>
              )}

              {selectedApp === "easypaisa" && !showQr && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
                  <p className="text-sm text-slate-400">EasyPaisa app should open now. If it does not, open EasyPaisa and send payment manually.</p>
                </div>
              )}

              {selectedApp === "easypaisa" && (
                <div>
                  <Label>Transaction ID / Reference Number</Label>
                  <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter EasyPaisa transaction ID" required />
                </div>
              )}

              {selectedApp === "card" && (
                <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-5 sm:p-6">
                  <div>
                    <Label className="text-slate-300 font-medium text-sm">Card Number</Label>
                    <Input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      inputMode="numeric"
                      className="mt-1 bg-[#0b1120]"
                      required
                    />
                  </div>
                  <div className="grid gap-4 grid-cols-2">
                    <div>
                      <Label className="text-slate-300 font-medium text-sm">Expiration Date</Label>
                      <Input
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        inputMode="numeric"
                        className="mt-1 bg-[#0b1120]"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 font-medium text-sm">CVV</Label>
                      <Input
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        className="mt-1 bg-[#0b1120]"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300 font-medium text-sm">Name on Card</Label>
                    <Input
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="As shown on card"
                      className="mt-1 bg-[#0b1120]"
                      required
                    />
                  </div>
                </div>
              )}

              {selectedApp === "jazzcash" && (
                <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-5 sm:p-6">
                  <div>
                    <Label className="text-slate-300 font-medium text-sm">JazzCash Mobile Wallet Number</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 03001234567"
                      inputMode="numeric"
                      className="mt-1 font-semibold text-lg bg-[#0b1120]"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Make sure your phone is active and unlocked to receive the MPIN verification prompt.
                    </p>
                  </div>
                </div>
              )}

              {selectedApp !== "card" && selectedApp !== "jazzcash" && selectedApp !== "easypaisa" && (
                <div>
                  <Label>Payment Screenshot</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                    className="w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-violet-600 file:px-4 file:py-2 file:text-sm file:text-white mt-1"
                    required
                  />
                </div>
              )}

              <Button type="submit" loading={submitting} className="w-full text-base py-3 bg-violet-600 hover:bg-violet-700 transition-all font-semibold rounded-xl">
                {selectedApp === "card"
                  ? "Pay with Card"
                  : selectedApp === "jazzcash"
                  ? "Pay with JazzCash Wallet"
                  : "Submit Payment Proof"}
              </Button>
            </form>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <Button 
                variant="ghost" 
                className="w-full sm:w-auto text-sm text-slate-400"
                onClick={() => setStep("payment")}
              >
                ← Change Payment Method
              </Button>
            </div>
            
            <p className="text-xs text-slate-500 mt-3 text-center">
              {["card", "jazzcash"].includes(selectedApp || "")
                ? "Your payment will be auto-processed and instantly approved on success."
                : "Manual verification is usually approved within 2-4 hours."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
