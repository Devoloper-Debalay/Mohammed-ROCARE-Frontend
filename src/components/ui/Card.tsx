import type { HTMLAttributes, ReactNode } from "react";

export function Card({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-card border border-ink/[0.06] bg-surface shadow-[0_1px_2px_rgba(14,42,43,0.04),0_8px_24px_-12px_rgba(14,42,43,0.12)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

type BadgeTone = "teal" | "orange" | "slate" | "gold" | "success" | "danger" | "neutral";

const badgeTone: Record<BadgeTone, string> = {
  teal: "bg-teal-tint text-teal-deep",
  orange: "bg-orange-tint text-orange-deep",
  slate: "bg-slate-tint text-slate-deep",
  gold: "bg-gold-tint text-gold-deep",
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  neutral: "bg-ink/[0.06] text-ink-soft",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight ${badgeTone[tone]}`}>
      {children}
    </span>
  );
}
