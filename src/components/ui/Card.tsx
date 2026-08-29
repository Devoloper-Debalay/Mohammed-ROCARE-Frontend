import type { HTMLAttributes, ReactNode } from "react";

export function Card({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-card border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-md backdrop-blur-md transition-all duration-200 text-gray-900 dark:text-gray-100 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

type BadgeTone = "teal" | "orange" | "slate" | "gold" | "success" | "danger" | "neutral";

const badgeTone: Record<BadgeTone, string> = {
  teal: "bg-teal-100 text-[#0f766e] dark:bg-teal-950/80 dark:text-teal-300 border border-teal-300 dark:border-teal-700",
  orange: "bg-orange-100 text-[#c2410c] dark:bg-orange-950/80 dark:text-orange-300 border border-orange-300 dark:border-orange-700",
  slate: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700",
  gold: "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700",
  success: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700",
  danger: "bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700",
  neutral: "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold tracking-tight ${badgeTone[tone]}`}>
      {children}
    </span>
  );
}
