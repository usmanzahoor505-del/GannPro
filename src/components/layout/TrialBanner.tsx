import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function TrialBanner() {
  const { subscription } = useAuth();

  if (!subscription || subscription.status !== "trial") return null;

  return (
    <div className="bg-gradient-to-r from-amber-950/80 to-orange-950/60 border-b border-amber-500/20 px-4 py-2.5 text-center text-sm">
      <span className="text-amber-200">
        ⏳ Free Trial: <strong>{subscription.daysRemaining}d {subscription.hoursRemaining}h</strong> remaining
      </span>
      <Link to="/subscribe" className="ml-3 text-amber-400 underline hover:text-amber-300">
        Subscribe now →
      </Link>
    </div>
  );
}
