import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#05070f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/30 via-transparent to-transparent" />
      <div className="relative mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-2xl shadow-violet-950/50">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-white">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-5xl font-black tracking-tight">GannPro9</h1>
        <p className="mt-4 text-xl text-slate-400">WD Gann Square of 9 Trading Calculator</p>
        <p className="mt-2 text-amber-400 font-semibold">90.4% Historical Accuracy</p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/register"><Button className="px-8 py-3 text-base">Start Free 3-Day Trial</Button></Link>
          <Link to="/login"><Button variant="secondary" className="px-8 py-3 text-base">Sign In</Button></Link>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3 text-left">
          {[
            { title: "Square of 9", desc: "Precision Gann levels with 45° increments" },
            { title: "Multi-Timeframe", desc: "Scalp to position — all timeframes covered" },
            { title: "3-Day Free Trial", desc: "Full access, no credit card required" },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="font-bold">{f.title}</h3>
              <p className="text-sm text-slate-400 mt-2">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-4 grid-cols-1 sm:grid-cols-3">
          {[
            { id: "basic", name: "Basic", price: "27,800 PKR", usd: "$100", period: "1 Month" },
            { id: "standard", name: "Standard", price: "83,400 PKR", usd: "$300", period: "3 Months", popular: true },
            { id: "pro", name: "Pro", price: "139,000 PKR", usd: "$500", period: "6 Months" },
          ].map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-6 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.03] ${
                p.popular
                  ? "border-violet-500/50 bg-violet-500/10 ring-2 ring-violet-500/30 shadow-lg shadow-violet-900/20"
                  : "border-violet-500/20 bg-violet-500/5 hover:border-violet-500/40"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                  Most Popular
                </span>
              )}
              <h3 className="font-bold text-lg text-violet-300">{p.name}</h3>
              <p className="text-3xl font-black mt-3">{p.price}</p>
              <p className="text-sm text-slate-400 mt-1">{p.usd} USD</p>
              <p className="text-xs text-slate-500 mt-1">{p.period}</p>
              <Link to={`/register?plan=${p.id}`} className="w-full mt-5">
                <Button
                  className={`w-full py-2.5 text-sm font-semibold ${
                    p.popular
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
                      : ""
                  }`}
                >
                  Subscribe Now
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
