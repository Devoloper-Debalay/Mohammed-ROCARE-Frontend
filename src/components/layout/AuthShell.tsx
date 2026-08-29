import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { StageRing } from "@/components/ui/StageRing";

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
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col justify-between px-6 py-8 sm:px-12 sm:py-10">
        <Link to="/" className="w-fit">
          <Logo />
        </Link>
        <div className="mx-auto w-full max-w-sm py-10">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: accentVar[accent] }}>
            {portalName}
          </p>
          {children}
        </div>
        <p className="text-xs text-ink-soft/60">© {new Date().getFullYear()} ROCARE. All rights reserved.</p>
      </div>
      <div
        className="relative hidden items-center justify-center overflow-hidden lg:flex"
        style={{ backgroundColor: "var(--color-ink)" }}
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, ${accentVar[accent]}55, transparent 45%), radial-gradient(circle at 80% 80%, ${accentVar[accent]}33, transparent 40%)`,
          }}
        />
        <div className="relative z-10 flex flex-col items-center text-center">
          <StageRing stages={stages} activeIndex={2} accent={accentVar[accent]} size={260} centerLabel="Live" centerSub="pipeline" light />
          <p className="mt-8 max-w-xs font-display text-2xl font-medium leading-snug text-white">{tagline}</p>
        </div>
      </div>
    </div>
  );
}
