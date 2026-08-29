import React, { useState, useEffect } from "react";
import { Rapido2DMap, type LatLng } from "./Rapido2DMap";
import { useTheme } from "@/context/ThemeContext";

interface RapidoLiveTrackerProps {
  serviceId?: string;
  serviceTitle?: string;
  customerAddress?: string;
  technicianName?: string;
  technicianPhone?: string;
  vehicleNumber?: string;
  vehicleModel?: string;
  startOtp?: string;
  initialStage?: string;
  isOpen?: boolean;
  onClose?: () => void;
  isModal?: boolean;
}

// Realistic Kolkata / Salt Lake / Urban route coordinates
const DEFAULT_RAPIDO_ROUTE: LatLng[] = [
  { lat: 22.5726, lng: 88.3639, label: "Central Hub / Service Center" },
  { lat: 22.5768, lng: 88.3752, label: "VIP Connector" },
  { lat: 22.5815, lng: 88.3910, label: "EM Bypass Junction" },
  { lat: 22.5852, lng: 88.4065, label: "Salt Lake Sector 1" },
  { lat: 22.5898, lng: 88.4180, label: "Central Park Crossing" },
  { lat: 22.5875, lng: 88.4285, label: "Sector 3 Roundabout" },
  { lat: 22.5840, lng: 88.4340, label: "Customer Residence" },
];

export function RapidoLiveTracker({
  serviceId = "SR-2026-08114",
  serviceTitle = "RO Membrane Replacement & Filter Service",
  customerAddress = "Block CF, Sector 1, Salt Lake, Kolkata",
  technicianName = "Subhashish Roy",
  technicianPhone = "+91 98301 44520",
  vehicleNumber = "WB 02 AX 4819",
  vehicleModel = "Honda Activa 6G (Black)",
  startOtp = "5812",
  initialStage = "IN_PROGRESS",
  isOpen = true,
  onClose,
  isModal = false,
}: RapidoLiveTrackerProps) {
  const [routeIndex, setRouteIndex] = useState(2);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const routePath = DEFAULT_RAPIDO_ROUTE;
  const currentPos = routePath[routeIndex] || routePath[0];
  const destinationPos = routePath[routePath.length - 1];

  const remainingStops = routePath.length - 1 - routeIndex;
  const distanceKm = (remainingStops * 0.6 + 0.2).toFixed(1);
  const etaMinutes = Math.max(1, Math.round(remainingStops * 2.5));
  const isArrived = routeIndex >= routePath.length - 1;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setRouteIndex((prev) => {
        if (prev >= routePath.length - 1) {
          return routePath.length - 1;
        }
        return prev + 1;
      });
    }, 2500 / speedMultiplier);

    return () => clearInterval(timer);
  }, [isPlaying, speedMultiplier, routePath.length]);

  const trackerContent = (
    <div className={`flex flex-col overflow-hidden rounded-3xl border border-ink/[0.08] ${isDark ? "bg-gray-900" : "bg-white"} shadow-xl`}>
      {/* Top Rapido-Style Status Bar */}
      <div className={`flex flex-wrap items-center justify-between px-6 py-4 border-b ${isDark ? "bg-gray-800/80 border-gray-700" : "bg-emerald-50/70 border-emerald-100"}`}>
        <div className="flex items-center gap-3">
          <span className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {isArrived ? "Technician Arrived at Location" : "Technician is on the way"}
              </span>
              <span className="font-mono text-xs text-gray-500 dark:text-gray-400">#{serviceId}</span>
            </div>
            <h3 className="font-display font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">
              {serviceTitle}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          {/* OTP Box */}
          <div className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-1.5">
            <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300">START OTP:</span>
            <span className="font-mono text-sm font-bold tracking-wider text-amber-700 dark:text-amber-400">
              {startOtp}
            </span>
          </div>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:opacity-80 transition-opacity"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2D Simple Rapido Map Viewport */}
      <div className="relative h-[280px] sm:h-[340px] w-full bg-gray-100 dark:bg-gray-950 overflow-hidden">
        <Rapido2DMap
          technicianPos={currentPos}
          destinationPos={destinationPos}
          routePath={routePath}
          currentRouteIndex={routeIndex}
          technicianName={technicianName}
          vehicleNumber={vehicleNumber}
        />

        {/* Floating ETA Badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-2xl bg-white/95 dark:bg-gray-900/95 px-4 py-2 shadow-lg border border-gray-200 dark:border-gray-800 backdrop-blur-sm">
          <span className="text-xl">🛵</span>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider">
              ESTIMATED ARRIVAL
            </p>
            <p className="font-display text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
              {isArrived ? "Arrived at Doorstep" : `${etaMinutes} mins (${distanceKm} km)`}
            </p>
          </div>
        </div>

        {/* Floating Play/Pause & Speed Buttons */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 bg-white/90 dark:bg-gray-900/90 p-1.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-md">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => setRouteIndex(0)}
            className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            title="Reset route"
          >
            ↺
          </button>
          <div className="flex gap-0.5 ml-1">
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeedMultiplier(s)}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                  speedMultiplier === s
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold"
                    : "text-gray-500"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rapido Technician Profile & Actions Card */}
      <div className="p-5 sm:p-6 bg-white dark:bg-gray-900">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
          {/* Driver details */}
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-bold text-white shadow-md">
                🛵
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white font-bold border-2 border-white dark:border-gray-900">
                ✓
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-base text-gray-900 dark:text-gray-100">{technicianName}</h4>
                <span className="rounded bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                  4.9 ⭐ (1,840+ rides)
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                {vehicleModel} • <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{vehicleNumber}</span>
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">Certified Senior Technician • Vaccinated</p>
            </div>
          </div>

          {/* Quick Contact Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={`tel:${technicianPhone}`}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 text-sm font-semibold shadow-md transition-colors"
            >
              <span>📞</span> Call
            </a>
            <button
              onClick={() => alert(`Opening live chat with ${technicianName}...`)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-2.5 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span>💬</span> Chat
            </button>
          </div>
        </div>

        {/* Destination & Step Progress */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3 border border-gray-100 dark:border-gray-800">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Delivery / Service Address
            </p>
            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 mt-1">{customerAddress}</p>
          </div>

          {/* Steps Timeline */}
          <div className="flex flex-col justify-center gap-2">
            {[
              { label: "Technician assigned & dispatched", done: true },
              { label: "On the way (Live GPS)", done: routeIndex >= 1 },
              { label: "Arrived at doorstep", done: isArrived },
              { label: "Service completed & OTP verified", done: false },
            ].map((step, idx) => (
              <div key={step.label} className="flex items-center gap-2 text-xs">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    step.done ? "bg-emerald-600 text-white" : "border border-gray-300 dark:border-gray-600 text-gray-400"
                  }`}
                >
                  {step.done ? "✓" : idx + 1}
                </span>
                <span className={step.done ? "font-semibold text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto">{trackerContent}</div>
      </div>
    );
  }

  return trackerContent;
}
