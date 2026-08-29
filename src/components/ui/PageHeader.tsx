import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#0f766e] dark:text-teal-400 font-mono">{eyebrow}</p>}
        <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-xl text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ModulePlaceholder({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-gray-300 dark:border-gray-700 py-20 text-center bg-gray-50/50 dark:bg-gray-900/50">
      <div className="mb-4 h-2 w-16 rounded-full bg-gray-300 dark:bg-gray-700" />
      <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-gray-700 dark:text-gray-300 font-medium">{note}</p>
    </div>
  );
}
