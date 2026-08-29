import React, { useState, useEffect } from "react";
import { Interactive3DMap, type GeoPoint } from "./Interactive3DMap";

interface LiveServiceTrackerProps {
  serviceId?: string;
  serviceTitle?: string;
  customerAddress?: string;
  technicianName?: string;
  technicianPhone?: string;
  initialStage?: string;
  isOpen?: boolean;
  onClose?: () => void;
  isModal?: boolean;
}

// Realistic Kolkata / Salt Lake / Urban mock route coordinates
const DEFAULT_ROUTE: GeoPoint[] = [
  { lat: 22.5726, lng: 88.3639, label: "Central Hub / Service Center" },
  { lat: 22.5768, lng: 88.3752, label: "VIP Connector" },
  { lat: 22.5815, lng: 88.3910, label: "EM Bypass Junction" },
  { lat: 22.5852, lng: 88.4065, label: "Salt Lake Sector 1" },
  { lat: 22.5898, lng: 88.4180, label: "Central Park Crossing" },
  { lat: 22.5875, lng: 88.4285, label: "Sector 3 Roundabout" },
  { lat: 22.5840, lng: 88.4340, label: "Customer Residence" },
];

const DESTINATION_POINT: GeoPoint = DEFAULT_ROUTE[DEFAULT_ROUTE.length - 1];

export function LiveServiceTracker({
  serviceId = "SR-2026-08114",
  serviceTitle = "RO Membrane Replacement & Multi-Stage TDS Calibration",
  customerAddress = "Block CF, Sector 1, Salt Lake, Kolkata",
  technicianName = "Rajesh Sharma",
  technicianPhone = "+91 98301 44520",
  initialStage = "IN_PROGRESS",
  isOpen = true,
  onClose,
  isModal = false,
}: LiveServiceTrackerProps) {
  const [routeIndex, setRouteIndex] = useState(2);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [cameraMode, setCameraMode] = useState<"3D" | "2D">("3D");
  const [isFollowing, setIsFollowing] = useState(true);
  const [copied, setCopied] = useState(false);

  const routePath = DEFAULT_ROUTE;
  const currentPos = routePath[routeIndex] || routePath[0];
  const progressPercent = Math.round((routeIndex / (routePath.length - 1)) * 100);

  // Dynamic telemetry calculations
  const remainingWaypoints = routePath.length - 1 - routeIndex;
  const distanceKm = (remainingWaypoints * 0.75 + 0.3).toFixed(1);
  const etaMinutes = Math.max(2, Math.round(remainingWaypoints * 3.5));
  const currentSpeed = isPlaying && remainingWaypoints > 0 ? (28 + (routeIndex % 3) * 6).toString() : "0";

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setRouteIndex((prev) => {
        if (prev >= routePath.length - 1) {
          return routePath.length - 1;
        }
        return prev + 1;
      });
    }, 2400 / speedMultiplier);

    return () => clearInterval(timer);
  }, [isPlaying, speedMultiplier, routePath.length]);

  const handleShare = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const content = (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-ink/[0.08] bg-surface shadow-[0_20px_60px_-15px_rgba(14,42,43,0.2)] backdrop-blur-xl">
      {/* Tracker Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-ink/[0.06] bg-gradient-to-r from-teal-tint/40 via-surface to-base px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-teal" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-teal-deep">LIVE TECHNICIAN TRACKER</span>
              <span className="rounded-full bg-teal-tint px-2 py-0.5 font-mono text-[10px] font-semibold text-teal-deep">
                #{serviceId}
              </span>
            </div>
            <p className="text-sm font-semibold text-ink sm:text-base">{serviceTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <button
            onClick={handleShare}
            className="rounded-full border border-ink/10 bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-ink/[0.04] transition-colors"
          >
            {copied ? "Link copied!" : "Share tracking"}
          </button>
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 text-ink-soft hover:bg-ink/10 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: 3D Map + Telemetry Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
        {/* 3D Map Viewport */}
        <div className="relative lg:col-span-8 h-[360px] sm:h-[440px] lg:h-auto bg-[#071213]">
          <Interactive3DMap
            technicianPos={currentPos}
            destinationPos={DESTINATION_POINT}
            routePath={routePath}
            currentRouteIndex={routeIndex}
            cameraMode={cameraMode}
            isFollowing={isFollowing}
            technicianName={technicianName}
            accentColor="#00f0ff"
          />

          {/* Floating Live Telemetry Overlay */}
          <div className="pointer-events-none absolute top-4 left-4 flex flex-col gap-2 z-10">
            <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0e2a2b]/85 px-4 py-2.5 shadow-2xl backdrop-blur-md">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-cyan-300 font-semibold tracking-wider uppercase">
                  ETA to Destination
                </span>
                <span className="font-display text-xl font-bold text-white leading-tight">
                  {routeIndex >= routePath.length - 1 ? "Arrived on site" : `${etaMinutes} mins`}
                </span>
              </div>
              <div className="h-7 w-px bg-white/15" />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-gray-400 font-semibold tracking-wider uppercase">
                  Distance
                </span>
                <span className="font-mono text-sm font-bold text-cyan-400">
                  {routeIndex >= routePath.length - 1 ? "0.0 km" : `${distanceKm} km`}
                </span>
              </div>
              <div className="h-7 w-px bg-white/15" />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-gray-400 font-semibold tracking-wider uppercase">
                  Speed
                </span>
                <span className="font-mono text-sm font-bold text-emerald-400">{currentSpeed} km/h</span>
              </div>
            </div>
          </div>

          {/* Floating Map Controls */}
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-2xl border border-white/15 bg-[#0e2a2b]/85 p-1.5 shadow-xl backdrop-blur-md">
            <button
              onClick={() => setCameraMode(cameraMode === "3D" ? "2D" : "3D")}
              className={`rounded-xl px-3 py-1 text-xs font-mono font-semibold transition-all ${
                cameraMode === "3D"
                  ? "bg-cyan-500 text-gray-950 shadow-md"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              {cameraMode} View
            </button>
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`rounded-xl px-3 py-1 text-xs font-mono font-semibold transition-all ${
                isFollowing
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Follow
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="rounded-xl px-2.5 py-1 text-xs font-mono font-semibold text-gray-300 hover:text-white"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button
              onClick={() => setRouteIndex(0)}
              className="rounded-xl px-2 py-1 text-xs font-mono text-gray-400 hover:text-white"
              title="Reset route"
            >
              ↺
            </button>
          </div>
        </div>

        {/* Telemetry & Service Steps Panel */}
        <div className="lg:col-span-4 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-ink/[0.06] bg-surface p-5 sm:p-6">
          {/* Technician Profile Card */}
          <div>
            <div className="flex items-center gap-3 rounded-2xl border border-ink/[0.06] bg-base p-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal text-lg font-bold text-white shadow-md">
                {technicianName.charAt(0)}
              </div>
              <div className="flex-1 truncate">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-ink truncate">{technicianName}</p>
                  <span className="rounded bg-teal-tint px-1.5 py-0.5 text-[10px] font-bold text-teal-deep">
                    VERIFIED
                  </span>
                </div>
                <p className="text-xs text-ink-soft/70">Certified RO & AC Technician</p>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className="font-bold text-gold-deep">★ 4.9</span>
                  <span className="text-ink-soft/50">· 280+ jobs</span>
                </div>
              </div>
            </div>

            {/* Quick Contact Actions */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href={`tel:${technicianPhone}`}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-teal/30 bg-teal-tint py-2 text-xs font-semibold text-teal-deep hover:bg-teal-tint/80 transition-colors"
              >
                📞 Call Tech
              </a>
              <button
                onClick={() => alert(`Connecting to WhatsApp with ${technicianName}...`)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-ink/10 bg-surface py-2 text-xs font-semibold text-ink-soft hover:bg-ink/[0.04] transition-colors"
              >
                💬 Message
              </button>
            </div>

            {/* Destination Address */}
            <div className="mt-4 rounded-xl bg-ink/[0.02] p-3 border border-ink/[0.04]">
              <p className="text-[11px] font-mono uppercase tracking-wider text-ink-soft/60">
                Destination Address
              </p>
              <p className="mt-0.5 text-xs font-medium text-ink">{customerAddress}</p>
            </div>

            {/* Live Service Pipeline Progress */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-mono text-ink-soft/70 mb-2">
                <span>SERVICE PROGRESS</span>
                <span className="font-bold text-teal-deep">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-ink/[0.06]">
                <div
                  className="h-full bg-gradient-to-r from-teal to-cyan-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Step Checklist */}
              <div className="mt-4 flex flex-col gap-2.5 text-xs">
                {[
                  { label: "Technician assigned & dispatched", done: true },
                  { label: "En route with GPS tracking", done: routeIndex >= 1 },
                  { label: "Arrive at customer site", done: routeIndex >= routePath.length - 1 },
                  { label: "Membrane replacement & testing", done: false },
                  { label: "Digital OTP job sign-off", done: false },
                ].map((step, idx) => (
                  <div key={step.label} className="flex items-center gap-2.5">
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        step.done
                          ? "bg-teal text-white"
                          : "border border-ink/20 text-ink-soft/40"
                      }`}
                    >
                      {step.done ? "✓" : idx + 1}
                    </span>
                    <span className={step.done ? "font-semibold text-ink" : "text-ink-soft/60"}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Simulation speed control */}
          <div className="mt-6 flex items-center justify-between border-t border-ink/[0.06] pt-3 text-xs text-ink-soft/70">
            <span className="font-mono">Sim Speed:</span>
            <div className="flex gap-1">
              {[1, 2, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeedMultiplier(s)}
                  className={`rounded-lg px-2 py-0.5 font-mono ${
                    speedMultiplier === s
                      ? "bg-teal text-white font-bold"
                      : "bg-ink/[0.04] text-ink-soft hover:bg-ink/[0.08]"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm">
        <div className="w-full max-w-5xl max-h-[95vh] overflow-y-auto">{content}</div>
      </div>
    );
  }

  return content;
}
