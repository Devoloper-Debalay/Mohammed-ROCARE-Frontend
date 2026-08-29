import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Accent = "teal" | "orange" | "slate" | "gold";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  accent?: Accent;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const accentSolid: Record<Accent, string> = {
  teal: "bg-teal text-white hover:bg-teal-deep",
  orange: "bg-orange text-white hover:bg-orange-deep",
  slate: "bg-slate text-white hover:bg-slate-deep",
  gold: "bg-gold text-ink hover:bg-gold-deep hover:text-white",
};

const accentGhost: Record<Accent, string> = {
  teal: "text-teal hover:bg-teal-tint",
  orange: "text-orange hover:bg-orange-tint",
  slate: "text-slate hover:bg-slate-tint",
  gold: "text-gold-deep hover:bg-gold-tint",
};

const accentSecondary: Record<Accent, string> = {
  teal: "border border-teal/30 text-teal-deep hover:bg-teal-tint",
  orange: "border border-orange/30 text-orange-deep hover:bg-orange-tint",
  slate: "border border-slate/30 text-slate-deep hover:bg-slate-tint",
  gold: "border border-gold/40 text-gold-deep hover:bg-gold-tint",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", accent = "teal", loading, icon, fullWidth, className = "", children, disabled, ...rest }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold tracking-tight transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";
    const variantClass =
      variant === "primary"
        ? accentSolid[accent]
        : variant === "secondary"
          ? accentSecondary[accent]
          : variant === "danger"
            ? "bg-danger text-white hover:bg-danger/90"
            : accentGhost[accent];

    return (
      <button
        ref={ref}
        className={`${base} ${variantClass} ${fullWidth ? "w-full" : ""} ${className}`}
        disabled={disabled || loading}
        {...rest}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
        ) : (
          icon
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
