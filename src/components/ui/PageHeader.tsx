import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ink-soft/60">{eyebrow}</p>}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-xl text-sm text-ink-soft/80">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ModulePlaceholder({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-ink/15 py-20 text-center">
      <div className="mb-4 h-2 w-16 rounded-full bg-ink/10" />
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-soft/70">{note}</p>
    </div>
  );
}
