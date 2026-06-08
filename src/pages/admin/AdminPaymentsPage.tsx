import { useEffect, useState } from "react";
import { api, AdminPayment } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [filter, setFilter] = useState("pending");
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const load = () => api.adminPayments(filter).then((d) => setPayments(d.payments)).catch(() => {});

  useEffect(() => { load(); }, [filter]);

  const handleApprove = async (id: string) => {
    try {
      await api.adminApprovePayment(id);
      toast("Payment approved! User notified.", "success");
      load();
    } catch {
      toast("Approval failed", "error");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.adminRejectPayment(id);
      toast("Payment rejected", "info");
      load();
    } catch {
      toast("Rejection failed", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#05070f] text-white">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Payment Requests</h1>
          <div className="flex gap-2">
            {["pending", "approved", "rejected", "all"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
                  filter === f ? "bg-violet-600 text-white" : "bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {payments.length === 0 ? (
            <p className="text-slate-500 text-center py-12">No payments found</p>
          ) : (
            payments.map((p) => (
              <div key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{p.users?.name} — {p.users?.email}</p>
                    <p className="text-sm text-slate-400 capitalize mt-1">
                      {p.plan_selected} Plan • {p.amount_pkr.toLocaleString()} PKR
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Txn: {p.transaction_id} • {new Date(p.submitted_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge status={p.status} />
                </div>

                {p.screenshot_url && (
                  <button
                    onClick={() => setPreview(p.screenshot_url)}
                    className="mt-3 block"
                  >
                    <img
                      src={p.screenshot_url}
                      alt="Payment screenshot"
                      className="h-24 rounded-lg border border-white/10 object-cover hover:opacity-80"
                    />
                    <span className="text-xs text-violet-400 mt-1">Click to preview full size</span>
                  </button>
                )}

                {p.status === "pending" && (
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => handleApprove(p.id)}>APPROVE</Button>
                    <Button variant="danger" onClick={() => handleReject(p.id)}>REJECT</Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {preview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPreview(null)}>
            <img src={preview} alt="Full screenshot" className="max-h-[90vh] max-w-full rounded-xl" />
          </div>
        )}
      </main>
    </div>
  );
}
