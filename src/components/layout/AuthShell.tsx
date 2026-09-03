import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { StageRing } from "@/components/ui/StageRing";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface AuthShellProps {
  children: ReactNode;
  portalName: string;
  accent: "teal" | "orange" | "slate" | "gold";
  tagline: string;
}

const accentVar: Record<AuthShellProps["accent"], string> = {
  teal: "var(--color-teal)",
  orange: "var(--color-orange)",
  slate: "var(--color-slate)",
  gold: "var(--color-gold)",
};

const stages = ["Requested", "Assigned", "In progress", "Completed"];

export function AuthShell({ children, portalName, accent, tagline }: AuthShellProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-base transition-colors duration-200">
      <div className="flex flex-col justify-between px-6 py-8 sm:px-12 sm:py-10 bg-surface">
        <div className="flex items-center justify-between w-full">
          <Link to="/" className="w-fit">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
        <div className="mx-auto w-full max-w-sm py-10">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: accentVar[accent] }}>
            {portalName}
          </p>
          {children}
        </div>
        <p className="text-xs text-ink-soft/60">© {new Date().getFullYear()} ROCARE. All rights reserved.</p>
      </div>
      <div className="relative hidden items-center justify-center overflow-hidden lg:flex bg-slate-50 dark:bg-[#070b14] border-l border-slate-200 dark:border-gray-800/80 transition-colors duration-200">
        <div
          className="absolute inset-0 opacity-40 dark:opacity-30 pointer-events-none transition-opacity duration-300"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, ${accentVar[accent]}35, transparent 50%), radial-gradient(circle at 75% 75%, ${accentVar[accent]}25, transparent 50%)`,
          }}
        />
        {/* Subtle decorative grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(var(--color-ink) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative z-10 flex flex-col items-center text-center px-8">
          <StageRing
            stages={stages}
            activeIndex={2}
            accent={accentVar[accent]}
            size={260}
            centerLabel="Live"
            centerSub="pipeline"
          />
          <p className="mt-8 max-w-xs font-display text-2xl font-semibold leading-snug text-ink transition-colors duration-200">
            {tagline}
          </p>
        </div>
      </div>
    </div>
  );
}
