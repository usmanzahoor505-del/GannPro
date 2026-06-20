import GannIntradayCalculator from "@/calculator/GannIntradayCalculator";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { TrialBanner } from "@/components/layout/TrialBanner";
import { LockedOverlay } from "@/components/dashboard/LockedOverlay";

export function IntradayCalculatorPage() {
  const { subscription } = useAuth();
  const locked = subscription ? !subscription.hasAccess : true;

  return (
    <div className="relative">
      <Navbar />
      <TrialBanner />
      <GannIntradayCalculator />
      <LockedOverlay locked={locked} message={subscription?.message} />
    </div>
  );
}
