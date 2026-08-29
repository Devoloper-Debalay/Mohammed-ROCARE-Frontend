export function Logo({ size = 32, mono = false }: { size?: number; mono?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
        <circle cx="20" cy="20" r="18" stroke={mono ? "currentColor" : "var(--color-teal)"} strokeWidth="2.5" strokeDasharray="24 4" />
        <path
          d="M20 10c4 5.5 7 9.6 7 13.2A7 7 0 0 1 13 23.2C13 19.6 16 15.5 20 10Z"
          fill={mono ? "currentColor" : "var(--color-orange)"}
        />
      </svg>
      <span className="font-display text-lg font-semibold tracking-tight text-ink">ROCARE</span>
    </div>
  );
}
