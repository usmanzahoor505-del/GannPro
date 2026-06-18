import { useEffect, useState } from "react";
import { api, AdminPayment } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";

// Parse bank name from enriched transaction ID like "TXN123 [HBL]"
function parseTxn(txn: string) {
  const match = txn?.match(/^(.*?)\s*\[(.+)\]$/);
  if (match) return { txnId: match[1].trim(), bankName: match[2].trim() };
  return { txnId: txn, bankName: null };
}

function methodLabel(method?: string) {
  if (!method) return { label: "Manual", color: "#8b5cf6" };
  if (method === "jazzcash") return { label: "JazzCash", color: "#d63f5e" };
  if (method === "easypaisa") return { label: "EasyPaisa", color: "#00a651" };
  if (method === "bank") return { label: "Bank Transfer", color: "#3b82f6" };
  return { label: method, color: "#8b5cf6" };
}

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [filter, setFilter] = useState("pending");
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const d = await api.adminPayments(filter);
      setPayments(d.payments);
    } catch {
      toast("Failed to load payments", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Auto-refresh every 30 seconds
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      await api.adminApprovePayment(id);
      toast("✅ Payment approved! User subscription activated.", "success");
      load();
    } catch {
      toast("Approval failed", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionId(id);
    try {
      await api.adminRejectPayment(id);
      toast("Payment rejected. User notified.", "info");
      load();
    } catch {
      toast("Rejection failed", "error");
    } finally {
      setActionId(null);
    }
  };

  const FILTERS = ["pending", "approved", "rejected", "all"];

  return (
    <div style={{ minHeight: "100vh", background: "#05070f", color: "#fff" }}>
      <Navbar />
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "32px 16px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Payment Requests</h1>
            <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
              Review and approve/reject user payment submissions
            </p>
          </div>
          <button
            onClick={load}
            style={{
              background: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.3)",
              color: "#a78bfa",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            ↻ Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                borderRadius: 8,
                padding: "6px 16px",
                fontSize: 13,
                fontWeight: 500,
                textTransform: "capitalize",
                cursor: "pointer",
                border: "none",
                background: filter === f ? "#7c3aed" : "rgba(255,255,255,0.06)",
                color: filter === f ? "#fff" : "#94a3b8",
                transition: "all 0.2s",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Payment list */}
        {loading && payments.length === 0 ? (
          <p style={{ textAlign: "center", color: "#475569", padding: "48px 0" }}>Loading...</p>
        ) : payments.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "64px 0",
            background: "rgba(255,255,255,0.02)",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <p style={{ fontSize: 40, margin: 0 }}>📭</p>
            <p style={{ color: "#475569", marginTop: 12 }}>No {filter} payments found</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {payments.map((p) => {
              const { txnId, bankName } = parseTxn(p.transaction_id || "");
              const { label: methodLabel_, color: methodColor } = methodLabel(p.payment_method);
              const isActioning = actionId === p.id;

              return (
                <div
                  key={p.id}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 16,
                    padding: "20px 22px",
                    transition: "border-color 0.2s",
                  }}
                >
                  {/* Top row: user info + status badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>
                        {p.users?.name || "Unknown User"}
                      </p>
                      <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>
                        {p.users?.email}
                      </p>
                    </div>
                    <Badge status={p.status} />
                  </div>

                  {/* Plan + Amount + Method */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
                    <span style={{
                      background: "rgba(139,92,246,0.15)",
                      border: "1px solid rgba(139,92,246,0.3)",
                      color: "#c4b5fd",
                      borderRadius: 6,
                      padding: "3px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "capitalize",
                    }}>
                      {p.plan_selected} Plan
                    </span>
                    <span style={{
                      background: "rgba(251,191,36,0.12)",
                      border: "1px solid rgba(251,191,36,0.3)",
                      color: "#fbbf24",
                      borderRadius: 6,
                      padding: "3px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      PKR {p.amount_pkr?.toLocaleString()}
                    </span>
                    <span style={{
                      background: `${methodColor}18`,
                      border: `1px solid ${methodColor}50`,
                      color: methodColor,
                      borderRadius: 6,
                      padding: "3px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {methodLabel_}
                    </span>
                  </div>

                  {/* Transaction details */}
                  <div style={{
                    marginTop: 14,
                    background: "rgba(0,0,0,0.3)",
                    borderRadius: 10,
                    padding: "12px 14px",
                    fontSize: 13,
                  }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ color: "#64748b" }}>Transaction ID:</span>
                      <span style={{ color: "#e2e8f0", fontFamily: "monospace", fontWeight: 600, wordBreak: "break-all" }}>
                        {txnId || "—"}
                      </span>
                    </div>
                    {bankName && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 6 }}>
                        <span style={{ color: "#64748b" }}>Sender Bank:</span>
                        <span style={{ color: "#60a5fa", fontWeight: 600 }}>{bankName}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 6 }}>
                      <span style={{ color: "#64748b" }}>Submitted:</span>
                      <span style={{ color: "#94a3b8" }}>
                        {new Date(p.submitted_at).toLocaleString("en-PK", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Screenshot */}
                  {p.screenshot_url ? (
                    <div style={{ marginTop: 14 }}>
                      <p style={{ color: "#64748b", fontSize: 12, marginBottom: 8 }}>Payment Screenshot:</p>
                      <button
                        onClick={() => setPreview(p.screenshot_url)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "block" }}
                      >
                        <img
                          src={p.screenshot_url}
                          alt="Payment screenshot"
                          style={{
                            height: 100,
                            borderRadius: 10,
                            border: "2px solid rgba(139,92,246,0.4)",
                            objectFit: "cover",
                            display: "block",
                            transition: "opacity 0.2s",
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.75")}
                          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
                        />
                        <span style={{ fontSize: 11, color: "#8b5cf6", marginTop: 4, display: "block" }}>
                          🔍 Click to view full size
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      marginTop: 14,
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 12,
                      color: "#f87171",
                    }}>
                      ⚠️ No screenshot uploaded
                    </div>
                  )}

                  {/* Approve / Reject buttons */}
                  {p.status === "pending" && (
                    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                      <button
                        onClick={() => handleApprove(p.id)}
                        disabled={isActioning}
                        style={{
                          flex: 1,
                          padding: "10px 0",
                          borderRadius: 10,
                          border: "none",
                          background: isActioning ? "#1e3a1e" : "linear-gradient(135deg, #16a34a, #15803d)",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: isActioning ? "not-allowed" : "pointer",
                          opacity: isActioning ? 0.6 : 1,
                          transition: "all 0.2s",
                        }}
                      >
                        {isActioning ? "Processing..." : "✅ APPROVE"}
                      </button>
                      <button
                        onClick={() => handleReject(p.id)}
                        disabled={isActioning}
                        style={{
                          flex: 1,
                          padding: "10px 0",
                          borderRadius: 10,
                          border: "none",
                          background: isActioning ? "#3a1e1e" : "linear-gradient(135deg, #dc2626, #b91c1c)",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: isActioning ? "not-allowed" : "pointer",
                          opacity: isActioning ? 0.6 : 1,
                          transition: "all 0.2s",
                        }}
                      >
                        {isActioning ? "Processing..." : "❌ REJECT"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Full-size screenshot preview modal */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div style={{ position: "relative", maxWidth: "100%", maxHeight: "90vh" }}>
            <img
              src={preview}
              alt="Payment Screenshot"
              style={{
                maxWidth: "100%",
                maxHeight: "85vh",
                borderRadius: 12,
                border: "2px solid rgba(139,92,246,0.5)",
                display: "block",
              }}
            />
            <button
              onClick={() => setPreview(null)}
              style={{
                position: "absolute",
                top: -16,
                right: -16,
                background: "#ef4444",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                color: "#fff",
                fontWeight: 700,
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
            <p style={{ color: "#64748b", textAlign: "center", fontSize: 12, marginTop: 8 }}>
              Click anywhere to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
