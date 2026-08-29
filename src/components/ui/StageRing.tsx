interface StageRingProps {
  stages: string[];
  activeIndex: number;
  size?: number;
  accent?: string;
  centerLabel?: string;
  centerSub?: string;
  light?: boolean;
}

/**
 * The platform's signature device: a segmented ring where each arc is one
 * real stage of the RO/service pipeline (New -> Accepted -> Ongoing ->
 * Completed, or filtration stage 1-4). Filled arcs = stages passed.
 */
export function StageRing({ stages, activeIndex, size = 220, accent = "var(--color-teal)", centerLabel, centerSub, light = false }: StageRingProps) {
  const strokeWidth = size * 0.055;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const gapDeg = 6;
  const segmentDeg = 360 / stages.length - gapDeg;

  const polarToCartesian = (angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const describeArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(endAngle);
    const end = polarToCartesian(startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Stage ${activeIndex + 1} of ${stages.length}: ${stages[activeIndex]}`}>
        {stages.map((_, i) => {
          const start = i * (segmentDeg + gapDeg);
          const end = start + segmentDeg;
          const passed = i <= activeIndex;
          return (
            <path
              key={i}
              d={describeArc(start, end)}
              fill="none"
              stroke={passed ? accent : "color-mix(in srgb, var(--color-ink) 8%, transparent)"}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={{ transition: "stroke 0.4s ease" }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        {centerLabel && (
          <span className={`font-display text-2xl font-semibold leading-tight ${light ? "text-white" : "text-ink"}`}>{centerLabel}</span>
        )}
        {centerSub && <span className={`mt-1 text-xs font-medium ${light ? "text-white/60" : "text-ink-soft/70"}`}>{centerSub}</span>}
      </div>
    </div>
  );
}

/** Compact horizontal version for use inside cards/lists. */
export function StageBar({ stages, activeIndex, accent = "var(--color-teal)" }: { stages: string[]; activeIndex: number; accent?: string }) {
  return (
    <div className="flex w-full items-center gap-1.5" role="img" aria-label={`Stage ${activeIndex + 1} of ${stages.length}: ${stages[activeIndex]}`}>
      {stages.map((label, i) => (
        <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
          <div
            className="h-1.5 w-full rounded-full transition-colors duration-300"
            style={{ backgroundColor: i <= activeIndex ? accent : "color-mix(in srgb, var(--color-ink) 8%, transparent)" }}
          />
          <span className={`text-[10px] font-medium uppercase tracking-wide ${i <= activeIndex ? "text-ink" : "text-ink-soft/50"}`}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
