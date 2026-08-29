export function Logo({ size = 32, mono = false }: { size?: number; mono?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden className="drop-shadow-sm">
        <circle cx="20" cy="20" r="18" stroke={mono ? "currentColor" : "#0f766e"} strokeWidth="2.8" strokeDasharray="24 4" />
        <path
          d="M20 10c4 5.5 7 9.6 7 13.2A7 7 0 0 1 13 23.2C13 19.6 16 15.5 20 10Z"
          fill={mono ? "currentColor" : "#ea580c"}
        />
      </svg>
      <div className="flex flex-col">
        <span className="font-display text-lg font-bold tracking-tight text-gray-900 dark:text-white leading-none">
          ROCARE <span className="text-[#0f766e] dark:text-teal-400 text-xs font-mono">INDIA</span>
        </span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 mt-0.5">
          RO • AC • Fridge • Geyser
        </span>
      </div>
    </div>
  );
}
