import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, Payment } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { TrialBanner } from "@/components/layout/TrialBanner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { downloadReceiptPdf } from "@/lib/receiptPdf";

export function UserDashboardPage() {
  const { user, subscription, refreshSubscription } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    refreshSubscription();
    api.getPaymentHistory().then((d) => setPayments(d.payments)).catch(() => {});
  }, [refreshSubscription]);

  const sub = subscription;
  const approvedPayment = payments.find((p) => p.status === "approved" && p.receipt_id);

  return (
    <div className="min-h-screen bg-[#05070f] text-white overflow-x-hidden">
      <Navbar />
      <TrialBanner />

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-slate-500 text-sm">{user?.email}</p>
        </div>

        {/* Status banners */}
        {sub?.status === "pending" && (
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
            <p className="text-yellow-300 font-medium">⏳ Payment Pending — Waiting for Admin Approval</p>
            <p className="text-sm text-yellow-200/70 mt-1">Your payment is under review. You will be notified once approved.</p>
          </div>
        )}
        {sub?.status === "active" && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-emerald-300 font-medium">✅ Payment Approved! Your {sub.planName} plan is now active.</p>
          </div>
        )}
        {sub?.status === "rejected" && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
            <p className="text-rose-300 font-medium">❌ Payment Rejected. Please resubmit your payment proof or contact support.</p>
            <Link to="/subscribe"><Button variant="danger" className="mt-3">Resubmit Payment</Button></Link>
          </div>
        )}
        {(sub?.status === "expired" || (!sub?.hasAccess && sub?.status !== "pending" && sub?.status !== "rejected")) && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
            <p className="text-rose-300 font-medium">🔒 Your free trial has ended. Please subscribe to continue.</p>
            <Link to="/subscribe"><Button className="mt-3">Subscribe Now</Button></Link>
          </div>
        )}

        {/* Status card */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Status" value={<Badge status={sub?.status || "expired"} />} />
          <StatCard label="Plan" value={sub?.planName || "—"} />
          <StatCard label="Days Remaining" value={sub?.hasAccess ? `${sub.daysRemaining}d ${sub.hoursRemaining}h` : "0"} />
          <StatCard
            label="Expires"
            value={
              sub?.subEnd
                ? new Date(sub.subEnd).toLocaleDateString()
                : sub?.trialEnd
                ? new Date(sub.trialEnd).toLocaleDateString()
                : "—"
            }
          />
        </div>

        {/* Subscription details */}
        {sub?.hasAccess && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Subscription Details</h2>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <DetailRow label="Plan" value={sub.planName || "Free Trial"} />
              <DetailRow label="Started" value={sub.subStart ? new Date(sub.subStart).toLocaleDateString() : sub.trialStart ? new Date(sub.trialStart).toLocaleDateString() : "—"} />
              <DetailRow label="Expires" value={sub.subEnd ? new Date(sub.subEnd).toLocaleDateString() : sub.trialEnd ? new Date(sub.trialEnd).toLocaleDateString() : "—"} />
              <DetailRow label="Days Remaining" value={`${sub.daysRemaining} days`} />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/calculator"><Button>Open Calculator</Button></Link>
              <Link to="/intraday-calculator"><Button>Open Intraday Calculator</Button></Link>
              <Link to="/subscribe"><Button variant="secondary">Upgrade Plan</Button></Link>
            </div>
          </div>
        )}

        {/* Receipt download */}
        {approvedPayment?.receipt_id && (
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6">
            <h2 className="text-lg font-semibold mb-2">🧾 Download Your Receipt</h2>
            <p className="text-sm text-slate-400 mb-4">Receipt #{approvedPayment.receipt_id}</p>
            <Button
              onClick={async () => {
                const { receipt } = await api.getReceipt(approvedPayment.receipt_id!);
                downloadReceiptPdf(receipt);
              }}
            >
              Download Receipt (PDF)
            </Button>
            <Link to={`/receipt/${approvedPayment.receipt_id}`} className="ml-3 text-sm text-violet-400 hover:text-violet-300">
              View HTML Receipt →
            </Link>
          </div>
        )}

        {/* Payment history */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Payment History</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-slate-500">No payments yet</p>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-[#0b1120] px-4 py-3 ring-1 ring-white/5">
                  <div>
                    <p className="text-sm font-medium capitalize">{p.plan_selected} — {p.amount_pkr.toLocaleString()} PKR</p>
                    <p className="text-xs text-slate-500">{new Date(p.submitted_at).toLocaleString()}</p>
                  </div>
                  <Badge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-white/5 pb-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
