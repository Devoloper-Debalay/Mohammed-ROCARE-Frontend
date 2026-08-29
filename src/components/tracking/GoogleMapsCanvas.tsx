import React, { useEffect, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";

export interface GeoPoint {
  lat: number;
  lng: number;
  label?: string;
  street?: string;
}

interface GoogleMapsCanvasProps {
  technicianPos: GeoPoint;
  destinationPos: GeoPoint;
  routePath: GeoPoint[];
  currentRouteIndex: number;
  isFollowing?: boolean;
  mapType?: "standard" | "satellite" | "traffic";
  technicianName?: string;
  zoomLevel?: number;
}

export function GoogleMapsCanvas({
  technicianPos,
  destinationPos,
  routePath,
  currentRouteIndex,
  isFollowing = true,
  mapType = "standard",
  technicianName = "Vendor Technician",
  zoomLevel = 1,
}: GoogleMapsCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let pulseAngle = 0;

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    // Exact Kolkata Geolocation Bounds (Dunlop/Baranagar in North down to Behala in South)
    const lats = routePath.map((p) => p.lat);
    const lngs = routePath.map((p) => p.lng);
    const minLat = Math.min(...lats, destinationPos.lat);
    const maxLat = Math.max(...lats, destinationPos.lat);
    const minLng = Math.min(...lngs, destinationPos.lng);
    const maxLng = Math.max(...lngs, destinationPos.lng);

    const latSpan = Math.max(maxLat - minLat, 0.16);
    const lngSpan = Math.max(maxLng - minLng, 0.12);

    const toScreen = (p: GeoPoint, w: number, h: number) => {
      const padX = 80 / zoomLevel;
      const padY = 60 / zoomLevel;
      const x = padX + ((p.lng - minLng) / lngSpan) * (w - padX * 2);
      const y = h - (padY + ((p.lat - minLat) / latSpan) * (h - padY * 2));
      return { x, y };
    };

    const render = () => {
      pulseAngle += 0.04;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // 1. Google Maps Base Color Palette
      if (mapType === "satellite") {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, width, height);
      } else if (isDark) {
        ctx.fillStyle = "#242f3e"; // Google Dark Base
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.fillStyle = "#f5f3f0"; // Google Maps Light Base
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Realistic Hooghly River (running North to South on the West side)
      ctx.fillStyle = mapType === "satellite" ? "#0f172a" : isDark ? "#17263c" : "#aad3df";
      ctx.beginPath();
      ctx.moveTo(width * 0.28, 0);
      ctx.bezierCurveTo(width * 0.22, height * 0.2, width * 0.18, height * 0.45, width * 0.26, height * 0.7);
      ctx.bezierCurveTo(width * 0.32, height * 0.85, width * 0.25, height * 0.95, width * 0.18, height);
      ctx.lineTo(0, height);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      // River Name Label
      ctx.fillStyle = isDark ? "#8ab4f8" : "#1a73e8";
      ctx.font = "italic bold 11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Hooghly River", width * 0.16, height * 0.35);

      // 3. Green Areas & Parks (Eco Park, Central Park, Lake Town, Chetla)
      const greenColor = mapType === "satellite" ? "#1e3a29" : isDark ? "#263c3f" : "#d4edda";
      const greenTextColor = isDark ? "#81c995" : "#2e7d32";

      // Central Park & Eco Park on East
      ctx.fillStyle = greenColor;
      ctx.beginPath();
      ctx.roundRect(width * 0.68, height * 0.22, width * 0.25, height * 0.18, 14);
      ctx.fill();
      ctx.fillStyle = greenTextColor;
      ctx.font = "bold 10px Inter, sans-serif";
      ctx.fillText("Eco Park / Newtown", width * 0.8, height * 0.31);

      // Lake Town & Bidhannagar
      ctx.fillStyle = greenColor;
      ctx.beginPath();
      ctx.roundRect(width * 0.58, height * 0.44, width * 0.26, height * 0.15, 12);
      ctx.fill();
      ctx.fillStyle = greenTextColor;
      ctx.fillText("Bidhannagar / Science City", width * 0.71, height * 0.52);

      // 4. Urban Land Area Labels (Kolkata, Baranagar, Howrah, Behala, Dum Dum)
      const cityLabelColor = isDark ? "#ffffff" : "#202124";
      ctx.fillStyle = cityLabelColor;

      // Baranagar (Top Origin Zone)
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Baranagar (Dunlop)", width * 0.46, height * 0.12);
      ctx.font = "10px Inter, sans-serif";
      ctx.fillStyle = isDark ? "#9ca3af" : "#5f6368";
      ctx.fillText("বরাহনগর • RO Care India Hub", width * 0.46, height * 0.15);

      // Central Kolkata (Mid Zone)
      ctx.fillStyle = cityLabelColor;
      ctx.font = "bold 15px Inter, sans-serif";
      ctx.fillText("Kolkata", width * 0.48, height * 0.5);
      ctx.font = "11px Inter, sans-serif";
      ctx.fillStyle = isDark ? "#9ca3af" : "#5f6368";
      ctx.fillText("কলকাতা", width * 0.48, height * 0.53);

      // Behala (Bottom Destination Zone)
      ctx.fillStyle = cityLabelColor;
      ctx.font = "bold 14px Inter, sans-serif";
      ctx.fillText("Behala", width * 0.35, height * 0.88);
      ctx.font = "10px Inter, sans-serif";
      ctx.fillStyle = isDark ? "#9ca3af" : "#5f6368";
      ctx.fillText("বেহালা • Customer Site", width * 0.35, height * 0.91);

      // West Howrah / Bally across river
      ctx.fillText("Bally / Howrah", width * 0.1, height * 0.18);
      ctx.fillText("Liluah", width * 0.12, height * 0.48);

      // 5. Road Network (BT Road ➔ Central Ave ➔ DH Road)
      const roadColor = mapType === "satellite" ? "#64748b" : isDark ? "#38414e" : "#ffffff";
      const roadBorder = mapType === "satellite" ? "#475569" : isDark ? "#2c3846" : "#dadce0";

      // Background Secondary Streets
      ctx.strokeStyle = roadBorder;
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // East-West connecting arteries (VIP Rd, Park St, AJC Bose Rd)
      ctx.beginPath();
      ctx.moveTo(width * 0.25, height * 0.28); // VIP Rd
      ctx.lineTo(width * 0.9, height * 0.24);
      ctx.moveTo(width * 0.25, height * 0.58); // AJC Bose Rd Flyover
      ctx.lineTo(width * 0.9, height * 0.58);
      ctx.moveTo(width * 0.15, height * 0.78); // Taratala Rd
      ctx.lineTo(width * 0.85, height * 0.78);
      ctx.stroke();

      ctx.strokeStyle = roadColor;
      ctx.lineWidth = 6;
      ctx.stroke();

      // 6. Active Google Maps Route (Baranagar ➔ Central Ave ➔ Behala)
      const pts = routePath.map((p) => toScreen(p, width, height));

      if (pts.length > 1) {
        // Alternative Route (Grey line)
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.bezierCurveTo(
          pts[0].x + 60,
          pts[0].y + 80,
          pts[pts.length - 1].x + 70,
          pts[pts.length - 1].y - 80,
          pts[pts.length - 1].x,
          pts[pts.length - 1].y
        );
        ctx.strokeStyle = isDark ? "#5f6368" : "#bdc1c6";
        ctx.lineWidth = 7;
        ctx.stroke();

        // Main Route Outer Border (Darker Blue)
        ctx.beginPath();
        pts.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.strokeStyle = isDark ? "#1967d2" : "#1a73e8";
        ctx.lineWidth = 10;
        ctx.stroke();

        // Main Route Solid Blue (Google Blue #4285F4)
        ctx.strokeStyle = isDark ? "#8ab4f8" : "#4285f4";
        ctx.lineWidth = 6;
        ctx.stroke();

        // Traveled Route (Vibrant Green)
        const traveled = pts.slice(0, currentRouteIndex + 1);
        if (traveled.length > 1) {
          ctx.beginPath();
          traveled.forEach((p, idx) => {
            if (idx === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.strokeStyle = isDark ? "#34a853" : "#0f9d58";
          ctx.lineWidth = 6;
          ctx.stroke();
        }

        // Floating Route Badge on Central Ave: "47 min • 19.9 km"
        const midPoint = pts[Math.min(currentRouteIndex + 1, pts.length - 1)] || pts[Math.floor(pts.length / 2)];
        if (midPoint) {
          const badgeW = 105;
          const badgeH = 22;
          ctx.fillStyle = isDark ? "#1e293b" : "#ffffff";
          ctx.strokeStyle = "#1a73e8";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(midPoint.x + 14, midPoint.y - badgeH / 2, badgeW, badgeH, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
          ctx.font = "bold 10px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("47 min • 19.9 km", midPoint.x + 14 + badgeW / 2, midPoint.y + 4);
        }
      }

      // 7. Origin Marker: RO Care India (Dunlop, Baranagar)
      const originPt = pts[0];
      if (originPt) {
        ctx.beginPath();
        ctx.arc(originPt.x, originPt.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = "#1a73e8";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Origin Label Tag
        ctx.fillStyle = isDark ? "#1e293b" : "#ffffff";
        ctx.strokeStyle = isDark ? "#475569" : "#dadce0";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(originPt.x - 60, originPt.y - 30, 120, 18, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
        ctx.font = "bold 9px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("RO Care India (Dunlop)", originPt.x, originPt.y - 18);
      }

      // 8. Destination Marker: Behala (Google Maps Red Teardrop Pin)
      const dest = toScreen(destinationPos, width, height);

      // Pin Shadow
      ctx.beginPath();
      ctx.ellipse(dest.x, dest.y + 2, 8, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.fill();

      // Red Teardrop Body
      ctx.save();
      ctx.translate(dest.x, dest.y - 18);
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.bezierCurveTo(-10, 8, -12, -4, 0, -12);
      ctx.bezierCurveTo(12, -4, 10, 8, 0, 18);
      ctx.closePath();
      ctx.fillStyle = "#ea4335"; // Google Red
      ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner White Circle
      ctx.beginPath();
      ctx.arc(0, -3, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.restore();

      // Destination Label Tag
      ctx.fillStyle = isDark ? "#1e293b" : "#ffffff";
      ctx.strokeStyle = "#ea4335";
      ctx.lineWidth = 1;
      const destText = "Behala Destination";
      ctx.font = "bold 10px Inter, sans-serif";
      const destW = ctx.measureText(destText).width + 16;
      ctx.beginPath();
      ctx.roundRect(dest.x - destW / 2, dest.y - 42, destW, 18, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
      ctx.textAlign = "center";
      ctx.fillText(destText, dest.x, dest.y - 30);

      // 9. Moving Technician Cursor (Google Navigation Vehicle with Blue Halo & Heading)
      const tech = toScreen(technicianPos, width, height);

      // Blue Accuracy Pulse
      const pulseRad = ((pulseAngle * 16) % 30) + 12;
      ctx.beginPath();
      ctx.arc(tech.x, tech.y, pulseRad, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(66, 133, 244, 0.25)";
      ctx.fill();

      // Calculate Heading Angle
      let heading = Math.PI / 2; // Default South heading
      if (currentRouteIndex < pts.length - 1) {
        const nextPt = pts[currentRouteIndex + 1];
        heading = Math.atan2(nextPt.y - tech.y, nextPt.x - tech.x);
      }

      ctx.save();
      ctx.translate(tech.x, tech.y);
      ctx.rotate(heading);

      // Forward Light Cone Beam
      const gradBeam = ctx.createRadialGradient(0, 0, 4, 0, 0, 36);
      gradBeam.addColorStop(0, "rgba(66, 133, 244, 0.4)");
      gradBeam.addColorStop(1, "rgba(66, 133, 244, 0)");
      ctx.fillStyle = gradBeam;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 36, -Math.PI / 4, Math.PI / 4);
      ctx.closePath();
      ctx.fill();

      // White Circle Border
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Google Navigation Blue Arrow
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-4, -6);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-4, 6);
      ctx.closePath();
      ctx.fillStyle = "#1a73e8";
      ctx.fill();

      ctx.restore();

      // Floating Vendor Tag
      const vendorTag = `🛵 ${technicianName}`;
      ctx.font = "bold 10px Inter, sans-serif";
      const vW = ctx.measureText(vendorTag).width + 16;
      ctx.fillStyle = isDark ? "#1e293b" : "#ffffff";
      ctx.strokeStyle = "#4285f4";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(tech.x - vW / 2, tech.y - 34, vW, 20, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
      ctx.textAlign = "center";
      ctx.fillText(vendorTag, tech.x, tech.y - 20);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [technicianPos, destinationPos, routePath, currentRouteIndex, isDark, mapType, technicianName, zoomLevel]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
