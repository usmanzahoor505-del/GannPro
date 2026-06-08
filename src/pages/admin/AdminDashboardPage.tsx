import { useEffect, useState } from "react";
import { api, AdminStats } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.adminStats().then((d) => setStats(d.stats)).catch(() => {});
  }, []);

  const cards = stats
    ? [
        { label: "Total Users", value: stats.total_users, color: "text-white" },
        { label: "Active Subscribers", value: stats.active_subscribers, color: "text-emerald-400" },
        { label: "Trial Users", value: stats.trial_users, color: "text-amber-400" },
        { label: "Expired Users", value: stats.expired_users, color: "text-rose-400" },
        { label: "Pending Payments", value: stats.pending_payments, color: "text-yellow-400" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#05070f] text-white">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">{c.label}</p>
              <p className={`text-3xl font-black mt-2 ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
