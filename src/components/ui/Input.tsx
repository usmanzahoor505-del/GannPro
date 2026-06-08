import { cn } from "@/utils/cn";
import { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl bg-[#0b1120] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all",
        "hover:border-white/20 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10",
        className
      )}
      {...props}
    />
  );
}

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn("text-xs text-slate-500 mb-1.5 block", className)}>{children}</label>;
}
