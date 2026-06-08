import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export function LockedOverlay({ locked, message }: { locked: boolean; message?: string | null }) {
  if (!locked) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070f]/90 backdrop-blur-sm">
      <div className="mx-4 max-w-md rounded-2xl border border-white/10 bg-[#0b1120] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/15 ring-1 ring-rose-500/25">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-400">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Calculator Locked</h2>
        <p className="text-sm text-slate-400 mb-6">
          {message || "Your free trial has ended. Please subscribe to continue."}
        </p>
        <Link to="/subscribe">
          <Button className="w-full">Subscribe to Continue</Button>
        </Link>
        <Link to="/dashboard" className="block mt-3 text-sm text-slate-500 hover:text-slate-300">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
