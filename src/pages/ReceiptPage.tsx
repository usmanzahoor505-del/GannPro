import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, Receipt } from "@/lib/api";
import { downloadReceiptPdf } from "@/lib/receiptPdf";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/layout/Navbar";

const PLAN_NAMES: Record<string, string> = { basic: "Basic", standard: "Standard", pro: "Pro" };

export function ReceiptPage() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    if (id) api.getReceipt(id).then((d) => setReceipt(d.receipt)).catch(() => {});
  }, [id]);

  if (!receipt) {
    return (
      <div className="min-h-screen bg-[#05070f] flex items-center justify-center text-slate-500">
        Loading receipt...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070f] text-white">
      <Navbar />
      <main className="mx-auto max-w-lg px-4 py-12">
        <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-b from-[#0b1120] to-[#05070f] p-8 shadow-2xl">
          <h1 className="text-center text-xl font-bold text-violet-300 tracking-wider">PAYMENT RECEIPT</h1>
          <hr className="my-4 border-white/10" />
          <div className="space-y-3 text-sm">
            {[
              ["Receipt No:", `#${receipt.receipt_no}`],
              ["Date:", new Date(receipt.created_at).toLocaleDateString()],
              ["User Name:", receipt.user_name],
              ["Email:", receipt.user_email],
              ["Plan:", PLAN_NAMES[receipt.plan] || receipt.plan],
              ["Amount Paid:", `${receipt.amount_pkr.toLocaleString()} PKR`],
              ["Valid From:", new Date(receipt.valid_from).toLocaleDateString()],
              ["Valid Until:", new Date(receipt.valid_until).toLocaleDateString()],
              ["Status:", "✅ APPROVED"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-500">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
          <hr className="my-6 border-white/10" />
          <p className="text-center text-emerald-400 font-semibold">Trading Calculator Access</p>
          <p className="text-center text-emerald-400/70 text-sm">Activated</p>
          <Button className="w-full mt-6" onClick={() => downloadReceiptPdf(receipt)}>
            Download PDF
          </Button>
        </div>
      </main>
    </div>
  );
}
