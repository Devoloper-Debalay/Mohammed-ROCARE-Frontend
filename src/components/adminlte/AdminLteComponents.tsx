import React, { ReactNode } from "react";
import { Link } from "react-router-dom";

/* ==========================================================================
   AdminLTE 4 Small Box (Stat Widget)
   ========================================================================== */
export interface AdminLteSmallBoxProps {
  title: string;
  value: string | number;
  icon: string;
  tone?: "primary" | "success" | "warning" | "danger" | "info" | "dark" | "teal";
  linkText?: string;
  linkTo?: string;
  onLinkClick?: () => void;
  subtext?: string;
}

export function AdminLteSmallBox({
  title,
  value,
  icon,
  tone = "primary",
  linkText = "More info",
  linkTo,
  onLinkClick,
  subtext,
}: AdminLteSmallBoxProps) {
  const toneClasses = {
    primary: "bg-[#0d6efd] text-white",
    success: "bg-[#198754] text-white",
    warning: "bg-[#ffc107] text-[#212529]",
    danger: "bg-[#dc3545] text-white",
    info: "bg-[#0dcaf0] text-[#212529]",
    dark: "bg-[#343a40] text-white",
    teal: "bg-[#20c997] text-white",
  }[tone];

  const footerClasses = {
    primary: "bg-[#0b5ed7]/30 hover:bg-[#0b5ed7]/50 text-white",
    success: "bg-[#157347]/30 hover:bg-[#157347]/50 text-white",
    warning: "bg-[#000]/10 hover:bg-[#000]/20 text-[#212529]",
    danger: "bg-[#bb2d3b]/30 hover:bg-[#bb2d3b]/50 text-white",
    info: "bg-[#000]/10 hover:bg-[#000]/20 text-[#212529]",
    dark: "bg-[#000]/20 hover:bg-[#000]/40 text-white",
    teal: "bg-[#0f766e]/30 hover:bg-[#0f766e]/50 text-white",
  }[tone];

  return (
    <div className={`relative overflow-hidden rounded-xl shadow-md transition-transform hover:-translate-y-0.5 ${toneClasses}`}>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight">{value}</h3>
            <p className="mt-1 text-xs sm:text-sm font-semibold uppercase tracking-wider opacity-90">{title}</p>
            {subtext && <p className="text-[11px] opacity-75 mt-0.5">{subtext}</p>}
          </div>
          <div className="text-3xl sm:text-4xl opacity-80 select-none">{icon}</div>
        </div>
      </div>
      {(linkTo || onLinkClick) && (
        linkTo ? (
          <Link
            to={linkTo}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold transition-colors ${footerClasses}`}
          >
            <span>{linkText}</span>
            <span>→</span>
          </Link>
        ) : (
          <button
            onClick={onLinkClick}
            className={`w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold transition-colors ${footerClasses}`}
          >
            <span>{linkText}</span>
            <span>→</span>
          </button>
        )
      )}
    </div>
  );
}

/* ==========================================================================
   AdminLTE 4 Info Box
   ========================================================================== */
export interface AdminLteInfoBoxProps {
  title: string;
  value: string | number;
  icon: string;
  tone?: "primary" | "success" | "warning" | "danger" | "info" | "teal";
  progress?: number;
  description?: string;
}

export function AdminLteInfoBox({
  title,
  value,
  icon,
  tone = "primary",
  progress,
  description,
}: AdminLteInfoBoxProps) {
  const iconToneClasses = {
    primary: "bg-[#0d6efd] text-white",
    success: "bg-[#198754] text-white",
    warning: "bg-[#ffc107] text-[#212529]",
    danger: "bg-[#dc3545] text-white",
    info: "bg-[#0dcaf0] text-[#212529]",
    teal: "bg-[#20c997] text-white",
  }[tone];

  return (
    <div className="flex items-center rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl shadow-sm ${iconToneClasses}`}>
        {icon}
      </div>
      <div className="ml-4 min-w-0 flex-1">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block truncate">{title}</span>
        <span className="font-mono text-xl font-extrabold text-gray-900 dark:text-white block mt-0.5">{value}</span>
        {progress !== undefined && (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div className={`h-full ${iconToneClasses}`} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
          </div>
        )}
        {description && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
      </div>
    </div>
  );
}

/* ==========================================================================
   AdminLTE 4 Card Widget
   ========================================================================== */
export interface AdminLteCardProps {
  title?: ReactNode;
  icon?: string;
  outlineTone?: "primary" | "success" | "warning" | "danger" | "info" | "teal" | "none";
  tools?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  badge?: { text: string; tone?: "primary" | "success" | "warning" | "danger" | "info" | "secondary" };
}

export function AdminLteCard({
  title,
  icon,
  outlineTone = "none",
  tools,
  children,
  footer,
  className = "",
  bodyClassName = "",
  badge,
}: AdminLteCardProps) {
  const outlineClasses = {
    none: "border-t-0",
    primary: "border-t-4 border-t-[#0d6efd]",
    success: "border-t-4 border-t-[#198754]",
    warning: "border-t-4 border-t-[#ffc107]",
    danger: "border-t-4 border-t-[#dc3545]",
    info: "border-t-4 border-t-[#0dcaf0]",
    teal: "border-t-4 border-t-[#20c997]",
  }[outlineTone];

  return (
    <div className={`rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${outlineClasses} ${className}`}>
      {(title || tools || badge) && (
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-3.5 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            {icon && <span className="text-lg">{icon}</span>}
            {title && <h3 className="font-display text-base font-bold text-gray-900 dark:text-white">{title}</h3>}
            {badge && (
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  badge.tone === "success"
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                    : badge.tone === "warning"
                    ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                    : badge.tone === "danger"
                    ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                    : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                }`}
              >
                {badge.text}
              </span>
            )}
          </div>
          {tools && <div className="flex items-center gap-2">{tools}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
      {footer && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-5 py-3 text-xs">
          {footer}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   AdminLTE 4 Table Wrapper
   ========================================================================== */
export function AdminLteTable({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left text-sm border-collapse">{children}</table>
    </div>
  );
}

/* ==========================================================================
   AdminLTE 4 Modal Dialog
   ========================================================================== */
export interface AdminLteModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
}

export function AdminLteModal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  maxWidth = "lg",
}: AdminLteModalProps) {
  if (!isOpen) return null;

  const widthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className={`w-full ${widthClass} rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            {icon && <span className="text-xl">{icon}</span>}
            <h3 className="font-display text-base font-bold text-gray-900 dark:text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 text-lg transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-6 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
