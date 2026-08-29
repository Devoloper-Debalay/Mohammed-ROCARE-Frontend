import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

interface PortalShellProps {
  navItems: NavItem[];
  accent: "teal" | "orange" | "slate" | "gold";
  portalLabel: string;
  userLabel: string;
  userMeta?: string;
  onLogout: () => void;
  children: ReactNode;
}

const accentText: Record<PortalShellProps["accent"], string> = {
  teal: "text-teal",
  orange: "text-orange",
  slate: "text-slate",
  gold: "text-gold-deep",
};

const accentBg: Record<PortalShellProps["accent"], string> = {
  teal: "bg-teal-tint text-teal-deep",
  orange: "bg-orange-tint text-orange-deep",
  slate: "bg-slate-tint text-slate-deep",
  gold: "bg-gold-tint text-gold-deep",
};

export function PortalShell({ navItems, accent, portalLabel, userLabel, userMeta, onLogout, children }: PortalShellProps) {
  return (
    <div className="flex min-h-screen bg-base">
      <aside className="flex w-64 shrink-0 flex-col border-r border-ink/[0.06] bg-surface px-4 py-6">
        <div className="px-2">
          <Logo size={28} />
          <p className={`mt-1 text-[11px] font-semibold uppercase tracking-widest ${accentText[accent]}`}>{portalLabel}</p>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.endsWith("dashboard") || item.to.split("/").length <= 2}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? accentBg[accent] : "text-ink-soft hover:bg-ink/[0.04]"
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-xl border border-ink/[0.06] p-3">
          <p className="truncate text-sm font-semibold text-ink">{userLabel}</p>
          {userMeta && <p className="truncate text-xs text-ink-soft/70">{userMeta}</p>}
          <button
            onClick={onLogout}
            className="mt-2 w-full rounded-lg border border-ink/10 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:bg-ink/[0.04]"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8 sm:px-10">{children}</div>
      </main>
    </div>
  );
}
