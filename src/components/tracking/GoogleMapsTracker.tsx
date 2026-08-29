import React, { useState, useEffect } from "react";
import { GoogleMapsCanvas, type GeoPoint } from "./GoogleMapsCanvas";
import { useTheme } from "@/context/ThemeContext";

interface GoogleMapsTrackerProps {
  serviceId?: string;
  serviceTitle?: string;
  vendorName?: string;
  technicianName?: string;
  vendorPhone?: string;
  vehicleNumber?: string;
  customerAddress?: string;
  initialStage?: string;
  isOpen?: boolean;
  onClose?: () => void;
  isModal?: boolean;
}

// Exact Baranagar (RO Care India Dunlop) to Behala route coordinates via Central Ave
const EXACT_KOLKATA_ROUTE: GeoPoint[] = [
  { lat: 22.6520, lng: 88.3760, label: "RO Care India (Dunlop)", street: "RO Care India, 2, Dilip Ganguly sarani, Dunlop, Baranagar" },
  { lat: 22.6240, lng: 88.3780, label: "BT Road / Sinthee", street: "Head south on Barrackpore Trunk (BT) Rd" },
  { lat: 22.6020, lng: 88.3720, label: "Shyambazar 5-Point", street: "Continue straight past Shyambazar toward Central Ave" },
  { lat: 22.5850, lng: 88.3610, label: "Central Ave / Girish Park", street: "via Central Ave / Chittaranjan Ave (Fastest route)" },
  { lat: 22.5670, lng: 88.3530, label: "Esplanade / Chandni", street: "Pass through Esplanade Crossing onto JL Nehru Rd" },
  { lat: 22.5410, lng: 88.3450, label: "Rabindra Sadan / Exide", street: "Continue past Exide Crossing onto Ashutosh Mukherjee Rd" },
  { lat: 22.5180, lng: 88.3320, label: "Alipore / Chetla Park", street: "Turn right toward Diamond Harbour Rd / Chetla" },
  { lat: 22.5080, lng: 88.3240, label: "Taratala Crossing", street: "Continue straight on Diamond Harbour Rd toward Behala" },
  { lat: 22.4980, lng: 88.3180, label: "Behala, Kolkata", street: "Arriving at Behala, Kolkata, West Bengal" },
];

export function GoogleMapsTracker({
  serviceId = "SR-2026-08114",
  serviceTitle = "Water Purifier (RO) & Appliance Service",
  vendorName,
  technicianName,
  vendorPhone = "+91 93115 87744",
  vehicleNumber = "WB 02 AX 4819",
  customerAddress,
  initialStage: _initialStage,
  isOpen = true,
  onClose,
  isModal = false,
}: GoogleMapsTrackerProps) {
  const activeVendorName = technicianName || vendorName || "Subhashish Roy (RO Care India Certified Vendor)";
  const [routeIndex, setRouteIndex] = useState(3);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [mapType, setMapType] = useState<"standard" | "satellite" | "traffic">("standard");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [transportMode, setTransportMode] = useState<"bike" | "car" | "transit" | "walk">("bike");

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const routePath = EXACT_KOLKATA_ROUTE;
  const currentPos = routePath[routeIndex] || routePath[0];
  const destinationPos = routePath[routePath.length - 1];

  const remainingStops = routePath.length - 1 - routeIndex;
  const distanceKm = (remainingStops * 2.3 + 1.5).toFixed(1);
  const etaMinutes = Math.max(2, Math.round(remainingStops * 5.8));
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
    }, 2800 / speedMultiplier);

    return () => clearInterval(timer);
  }, [isPlaying, speedMultiplier, routePath.length]);

  const content = (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl transition-all">
      
      {/* 1. Google Maps Top Search & Directions Bar */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Origin and Destination Route Display */}
          <div className="flex flex-col gap-1.5 flex-1 max-w-2xl">
            <div className="flex items-center gap-2 text-xs">
              <span className="h-3 w-3 rounded-full border-2 border-blue-600 bg-white" />
              <span className="font-bold text-gray-900 dark:text-white truncate">
                RO Care India, 2, Dilip Ganguly sarani, Dunlop, Baranagar, Kolkata 700035
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="h-3 w-3 rounded-full bg-red-600" />
              <span className="font-bold text-gray-900 dark:text-white truncate">
                Behala, Kolkata, West Bengal
              </span>
            </div>
          </div>

          {/* Transport Mode Switcher */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl border border-gray-200 dark:border-gray-700 text-xs self-start sm:self-auto">
            <button
              onClick={() => setTransportMode("bike")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-all ${
                transportMode === "bike" ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-700 dark:text-gray-300"
              }`}
            >
              🛵 47 min
            </button>
            <button
              onClick={() => setTransportMode("car")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-all ${
                transportMode === "car" ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-700 dark:text-gray-300"
              }`}
            >
              🚗 48 min
            </button>
            <button
              onClick={() => setTransportMode("transit")}
              className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-medium ${
                transportMode === "transit" ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm" : "text-gray-500"
              }`}
            >
              🚌 2h 2m
            </button>
          </div>
        </div>

        {/* Search Along Route Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
          <span className="text-gray-500 text-[11px] font-medium">Search along route:</span>
          <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-blue-500">
            ⛽ Gas
          </span>
          <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-blue-500">
            ⚡ EV charging
          </span>
          <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-blue-500">
            🏨 Hotels
          </span>
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="ml-auto h-7 w-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. Map Viewport Canvas */}
      <div className="relative h-[340px] sm:h-[440px] w-full bg-[#f5f3f0] dark:bg-[#242f3e] overflow-hidden">
        <GoogleMapsCanvas
          technicianPos={currentPos}
          destinationPos={destinationPos}
          routePath={routePath}
          currentRouteIndex={routeIndex}
          mapType={mapType}
          technicianName={(activeVendorName || "Subhashish").split(" ")[0]}
          zoomLevel={zoomLevel}
        />

        {/* Top Turn Maneuver Overlay */}
        <div className="absolute top-3 left-3 z-10 max-w-sm">
          <div className="flex items-center gap-3 rounded-2xl bg-[#137333] text-white px-4 py-2.5 shadow-lg">
            <span className="text-xl font-bold">⬆️</span>
            <div>
              <p className="font-bold text-xs leading-tight">
                {isArrived ? "Arrived at Behala destination" : routePath[routeIndex]?.street}
              </p>
              <p className="text-[10px] text-emerald-200 font-medium">via Central Ave / Chittaranjan Ave (Best route)</p>
            </div>
          </div>
        </div>

        {/* Google Maps Floating Layer & Zoom Stack (Right Side) */}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
          {/* Layer switcher */}
          <div className="flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
            <button
              onClick={() => setMapType("standard")}
              className={`px-3 py-1.5 font-bold ${
                mapType === "standard" ? "bg-blue-50 dark:bg-blue-950 text-blue-600 font-bold" : "text-gray-700 dark:text-gray-300"
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setMapType("traffic")}
              className={`px-3 py-1.5 font-bold border-t border-gray-100 dark:border-gray-800 ${
                mapType === "traffic" ? "bg-blue-50 dark:bg-blue-950 text-blue-600 font-bold" : "text-gray-700 dark:text-gray-300"
              }`}
            >
              Traffic
            </button>
            <button
              onClick={() => setMapType("satellite")}
              className={`px-3 py-1.5 font-bold border-t border-gray-100 dark:border-gray-800 ${
                mapType === "satellite" ? "bg-blue-50 dark:bg-blue-950 text-blue-600 font-bold" : "text-gray-700 dark:text-gray-300"
              }`}
            >
              Satellite
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.15))}
              className="h-8 w-8 flex items-center justify-center font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              +
            </button>
            <div className="h-px bg-gray-200 dark:bg-gray-700" />
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
              className="h-8 w-8 flex items-center justify-center font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              −
            </button>
          </div>
        </div>

        {/* Simulation Controls */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-white/90 dark:bg-gray-900/90 px-3 py-1.5 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-500 shadow-sm"
          >
            {isPlaying ? "Pause Route" : "Resume"}
          </button>
          <button
            onClick={() => setRouteIndex(0)}
            className="px-2 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            ↺ Restart
          </button>
          <div className="flex gap-0.5 ml-1">
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeedMultiplier(s)}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                  speedMultiplier === s ? "bg-blue-600 text-white font-bold" : "text-gray-500"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Vendor / Technician & Route Summary Card (Clean, No OTP) */}
      <div className="p-5 sm:p-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Route Metrics */}
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl sm:text-3xl font-extrabold text-[#137333] dark:text-[#34a853]">
                {isArrived ? "Arrived at Behala" : `${etaMinutes} min`}
              </span>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                ({isArrived ? "19.9 km completed" : `${distanceKm} km remaining`})
              </span>
            </div>
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-1">
              via Central Ave / Chittaranjan Ave • <span className="text-emerald-600 dark:text-emerald-400">Best route now due to traffic conditions</span>
            </p>
          </div>

          {/* Direct Contact Button */}
          <div className="flex items-center gap-3">
            <a
              href={`tel:${vendorPhone}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1a73e8] hover:bg-blue-700 text-white px-6 py-2.5 text-sm font-bold shadow-md transition-colors"
            >
              <span>📞</span> Call Vendor
            </a>
          </div>
        </div>

        {/* Clean Vendor Name Bar */}
        <div className="mt-4 rounded-2xl bg-gray-50 dark:bg-gray-800/80 p-4 border border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f766e] text-white text-xl font-bold shadow-md">
              🛵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">{activeVendorName}</h4>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  4.9 ★ Verified
                </span>
              </div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-0.5">
                Vehicle: <span className="font-bold text-gray-900 dark:text-white">{vehicleNumber}</span> • Dunlop Baranagar Hub
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Service Category</span>
            <span className="text-xs font-bold text-[#0f766e] dark:text-teal-400">{serviceTitle}</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-4xl max-h-[94vh] overflow-y-auto">{content}</div>
      </div>
    );
  }

  return content;
}
