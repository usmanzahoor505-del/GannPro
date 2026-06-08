import { cn } from "@/utils/cn";

const variants: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25",
  trial: "bg-amber-500/15 text-amber-400 ring-amber-500/25",
  pending: "bg-yellow-500/15 text-yellow-400 ring-yellow-500/25",
  expired: "bg-rose-500/15 text-rose-400 ring-rose-500/25",
  cancelled: "bg-rose-500/15 text-rose-400 ring-rose-500/25",
  rejected: "bg-rose-500/15 text-rose-400 ring-rose-500/25",
  approved: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25",
};

export function Badge({ status, className }: { status: string; className?: string }) {
  const v = variants[status] || "bg-slate-500/15 text-slate-400 ring-slate-500/25";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ring-1 ring-inset",
        v,
        className
      )}
    >
      {status}
    </span>
  );
}
