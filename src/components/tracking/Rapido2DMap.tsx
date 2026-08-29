import React, { useEffect, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";

export interface LatLng {
  lat: number;
  lng: number;
  label?: string;
}

interface Rapido2DMapProps {
  technicianPos: LatLng;
  destinationPos: LatLng;
  routePath: LatLng[];
  currentRouteIndex: number;
  isFollowing?: boolean;
  technicianName?: string;
  vehicleNumber?: string;
}

export function Rapido2DMap({
  technicianPos,
  destinationPos,
  routePath,
  currentRouteIndex,
  isFollowing = true,
  technicianName = "Technician",
  vehicleNumber = "WB 02 AX 4819",
}: Rapido2DMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let pulseVal = 0;

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    // Calculate map bounds
    const lats = routePath.map((p) => p.lat);
    const lngs = routePath.map((p) => p.lng);
    const minLat = Math.min(...lats, destinationPos.lat);
    const maxLat = Math.max(...lats, destinationPos.lat);
    const minLng = Math.min(...lngs, destinationPos.lng);
    const maxLng = Math.max(...lngs, destinationPos.lng);

    const latSpan = Math.max(maxLat - minLat, 0.012);
    const lngSpan = Math.max(maxLng - minLng, 0.012);

    const toScreen = (p: LatLng, w: number, h: number) => {
      const pad = 60;
      const x = pad + ((p.lng - minLng) / lngSpan) * (w - pad * 2);
      const y = h - (pad + ((p.lat - minLat) / latSpan) * (h - pad * 2));
      return { x, y };
    };

    const render = () => {
      pulseVal += 0.05;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // 1. Background Map Canvas (Clean light/dark 2D tile style)
      ctx.fillStyle = isDark ? "#111827" : "#f1f5f9";
      ctx.fillRect(0, 0, width, height);

      // Draw subtle urban grid / city blocks
      ctx.fillStyle = isDark ? "#1f2937" : "#e2e8f0";
      const blockCount = 8;
      for (let i = 0; i < blockCount; i++) {
        for (let j = 0; j < blockCount; j++) {
          if ((i + j) % 2 === 0) {
            const bx = (i * width) / blockCount + 8;
            const by = (j * height) / blockCount + 8;
            const bw = width / blockCount - 16;
            const bh = height / blockCount - 16;
            ctx.beginPath();
            ctx.roundRect(bx, by, bw, bh, 6);
            ctx.fill();
          }
        }
      }

      // Draw secondary road grid
      ctx.strokeStyle = isDark ? "rgba(75, 85, 99, 0.4)" : "rgba(203, 213, 225, 0.8)";
      ctx.lineWidth = 6;
      for (let x = 0; x <= width; x += width / 4) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += height / 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw Full Route Path (Grey / dashed pending path)
      const points = routePath.map((p) => toScreen(p, width, height));

      if (points.length > 1) {
        // Road underlay
        ctx.beginPath();
        points.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.strokeStyle = isDark ? "#374151" : "#cbd5e1";
        ctx.lineWidth = 10;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        // Remaining dashed road
        ctx.beginPath();
        points.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.strokeStyle = isDark ? "#9ca3af" : "#94a3b8";
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 3. Draw Completed / Traveled Route (Rapido Solid Vibrant Green / Teal)
      const traveledPoints = points.slice(0, currentRouteIndex + 1);
      if (traveledPoints.length > 1) {
        ctx.beginPath();
        traveledPoints.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.strokeStyle = "#10b981"; // Vibrant Rapido green
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = "#10b981";
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // 4. Draw Customer Destination Pin (Home / Red Pin)
      const dest = toScreen(destinationPos, width, height);

      // Destination pulsing circle
      const destPulse = ((pulseVal * 12) % 24) + 6;
      ctx.beginPath();
      ctx.arc(dest.x, dest.y, destPulse, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(239, 68, 68, 0.35)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Destination Pin Body
      ctx.beginPath();
      ctx.arc(dest.x, dest.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Home icon inside pin
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("📍", dest.x, dest.y + 3);

      // Destination Tag
      ctx.fillStyle = isDark ? "#1e293b" : "#ffffff";
      ctx.strokeStyle = isDark ? "#334155" : "#e2e8f0";
      ctx.lineWidth = 1;
      const destTagW = 100;
      ctx.beginPath();
      ctx.roundRect(dest.x - destTagW / 2, dest.y - 32, destTagW, 20, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = isDark ? "#f8fafc" : "#0f172a";
      ctx.font = "600 10px Inter, sans-serif";
      ctx.fillText("Customer Location", dest.x, dest.y - 18);

      // 5. Draw 2D Rapido Technician Bike Marker
      const tech = toScreen(technicianPos, width, height);

      // Calculate heading angle based on next waypoint
      let angle = 0;
      if (currentRouteIndex < points.length - 1) {
        const nextPt = points[currentRouteIndex + 1];
        angle = Math.atan2(nextPt.y - tech.y, nextPt.x - tech.x);
      }

      // Animated green pulse wave around bike
      const techPulse = ((pulseVal * 18) % 32) + 12;
      ctx.beginPath();
      ctx.arc(tech.x, tech.y, techPulse, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Bike Circle Badge
      ctx.save();
      ctx.translate(tech.x, tech.y);
      ctx.rotate(angle);

      // Heading pointer triangle
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-4, -8);
      ctx.lineTo(-4, 8);
      ctx.closePath();
      ctx.fillStyle = "#10b981";
      ctx.fill();

      ctx.restore();

      // Main Bike Icon Body
      ctx.beginPath();
      ctx.arc(tech.x, tech.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981";
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Bike Emoji / Icon inside
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🛵", tech.x, tech.y + 4);

      // Floating Technician Name & Plate Badge
      const nameText = `${technicianName} • ${vehicleNumber}`;
      ctx.font = "bold 10px Inter, sans-serif";
      const nameW = ctx.measureText(nameText).width + 16;

      ctx.fillStyle = isDark ? "#0f172a" : "#ffffff";
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(tech.x - nameW / 2, tech.y - 36, nameW, 20, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
      ctx.textAlign = "center";
      ctx.fillText(nameText, tech.x, tech.y - 22);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [technicianPos, destinationPos, routePath, currentRouteIndex, isDark, technicianName, vehicleNumber]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
