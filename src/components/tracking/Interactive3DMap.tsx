import React, { useEffect, useRef } from "react";

export interface GeoPoint {
  lat: number;
  lng: number;
  label?: string;
}

interface Interactive3DMapProps {
  technicianPos: GeoPoint;
  destinationPos: GeoPoint;
  routePath: GeoPoint[];
  currentRouteIndex: number;
  cameraMode: "3D" | "2D";
  isFollowing: boolean;
  accentColor?: string;
  technicianName?: string;
}

export function Interactive3DMap({
  technicianPos,
  destinationPos,
  routePath,
  currentRouteIndex,
  cameraMode,
  isFollowing,
  accentColor = "#0f7a6e",
  technicianName = "Technician",
}: Interactive3DMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef({ pitch: 0.85, yaw: -0.35 });
  const mouseRef = useRef({ isDragging: false, lastX: 0, lastY: 0 });

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

    // Bounding calculation for coordinate normalization
    const minLat = Math.min(...routePath.map((p) => p.lat), destinationPos.lat);
    const maxLat = Math.max(...routePath.map((p) => p.lat), destinationPos.lat);
    const minLng = Math.min(...routePath.map((p) => p.lng), destinationPos.lng);
    const maxLng = Math.max(...routePath.map((p) => p.lng), destinationPos.lng);

    const latSpan = Math.max(maxLat - minLat, 0.015);
    const lngSpan = Math.max(maxLng - minLng, 0.015);

    const toWorldCoords = (p: GeoPoint) => {
      const nx = ((p.lng - minLng) / lngSpan - 0.5) * 450;
      const ny = ((p.lat - minLat) / latSpan - 0.5) * 450;
      return { x: nx, y: -ny, z: 0 };
    };

    const render = () => {
      pulseAngle += 0.04;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background styling
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, "#0b1c1d");
      grad.addColorStop(1, "#071213");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2 + (cameraMode === "3D" ? 30 : 0);
      const pitch = cameraMode === "3D" ? rotationRef.current.pitch : 0.01;
      const yaw = cameraMode === "3D" ? rotationRef.current.yaw : 0;
      const focal = 480;

      const techWorld = toWorldCoords(technicianPos);

      // Project 3D point to 2D screen
      const project = (wx: number, wy: number, wz: number = 0) => {
        let x = wx;
        let y = wy;
        let z = wz;

        if (isFollowing) {
          x -= techWorld.x * 0.7;
          y -= techWorld.y * 0.7;
        }

        // Apply Yaw (Y-axis rotation)
        const rx = x * Math.cos(yaw) - y * Math.sin(yaw);
        const ry = x * Math.sin(yaw) + y * Math.cos(yaw);

        // Apply Pitch (X-axis tilt)
        const py = ry * Math.cos(pitch) - z * Math.sin(pitch);
        const pz = ry * Math.sin(pitch) + z * Math.cos(pitch);

        const scale = focal / (focal + pz + 280);
        return {
          sx: cx + rx * scale,
          sy: cy + py * scale,
          scale,
          visible: pz + 280 > 10,
        };
      };

      // 1. Draw 3D Ground Grid & City Blocks
      ctx.strokeStyle = "rgba(0, 240, 255, 0.06)";
      ctx.lineWidth = 1;
      const gridSize = 400;
      const step = 50;

      for (let gx = -gridSize; gx <= gridSize; gx += step) {
        const p1 = project(gx, -gridSize, 0);
        const p2 = project(gx, gridSize, 0);
        if (p1.visible && p2.visible) {
          ctx.beginPath();
          ctx.moveTo(p1.sx, p1.sy);
          ctx.lineTo(p2.sx, p2.sy);
          ctx.stroke();
        }
      }
      for (let gy = -gridSize; gy <= gridSize; gy += step) {
        const p1 = project(-gridSize, gy, 0);
        const p2 = project(gridSize, gy, 0);
        if (p1.visible && p2.visible) {
          ctx.beginPath();
          ctx.moveTo(p1.sx, p1.sy);
          ctx.lineTo(p2.sx, p2.sy);
          ctx.stroke();
        }
      }

      // 2. Draw 3D Isometric Buildings along the city zone
      const buildings = [
        { x: -140, y: -80, w: 45, h: 45, height: 70 },
        { x: -80, y: 110, w: 55, h: 40, height: 95 },
        { x: 130, y: -120, w: 40, h: 50, height: 85 },
        { x: 160, y: 80, w: 50, h: 60, height: 110 },
        { x: 40, y: -170, w: 45, h: 45, height: 60 },
        { x: -170, y: 30, w: 50, h: 40, height: 75 },
      ];

      if (cameraMode === "3D") {
        buildings.forEach((b) => {
          const b1 = project(b.x, b.y, 0);
          const b2 = project(b.x + b.w, b.y, 0);
          const b3 = project(b.x + b.w, b.y + b.h, 0);
          const b4 = project(b.x, b.y + b.h, 0);

          const t1 = project(b.x, b.y, b.height);
          const t2 = project(b.x + b.w, b.y, b.height);
          const t3 = project(b.x + b.w, b.y + b.h, b.height);
          const t4 = project(b.x, b.y + b.h, b.height);

          if (b1.visible && t1.visible) {
            // Building sides
            ctx.fillStyle = "rgba(14, 42, 43, 0.65)";
            ctx.strokeStyle = "rgba(15, 122, 110, 0.3)";
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(b1.sx, b1.sy);
            ctx.lineTo(b2.sx, b2.sy);
            ctx.lineTo(t2.sx, t2.sy);
            ctx.lineTo(t1.sx, t1.sy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Roof
            ctx.fillStyle = "rgba(15, 122, 110, 0.25)";
            ctx.beginPath();
            ctx.moveTo(t1.sx, t1.sy);
            ctx.lineTo(t2.sx, t2.sy);
            ctx.lineTo(t3.sx, t3.sy);
            ctx.lineTo(t4.sx, t4.sy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        });
      }

      // 3. Draw Full Planned Route Path (Dashed)
      const projectedPath = routePath.map((pt) => {
        const w = toWorldCoords(pt);
        return project(w.x, w.y, 2);
      });

      if (projectedPath.length > 1) {
        ctx.beginPath();
        projectedPath.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.sx, p.sy);
          else ctx.lineTo(p.sx, p.sy);
        });
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 4;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 4. Draw Glowing Traveled Path
      const traveledProjected = projectedPath.slice(0, currentRouteIndex + 1);
      if (traveledProjected.length > 1) {
        ctx.beginPath();
        traveledProjected.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.sx, p.sy);
          else ctx.lineTo(p.sx, p.sy);
        });
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 6;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // 5. Draw Customer Destination Marker
      const destWorld = toWorldCoords(destinationPos);
      const destProj = project(destWorld.x, destWorld.y, 4);

      if (destProj.visible) {
        // Destination Radar Ping
        const pingRad = ((pulseAngle * 18) % 36) * destProj.scale;
        ctx.beginPath();
        ctx.arc(destProj.sx, destProj.sy, pingRad, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 107, 53, 0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pin Base
        ctx.beginPath();
        ctx.arc(destProj.sx, destProj.sy, 8 * destProj.scale, 0, Math.PI * 2);
        ctx.fillStyle = "#ff6b35";
        ctx.shadowColor = "#ff6b35";
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.max(10, Math.floor(12 * destProj.scale))}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("Customer Location", destProj.sx, destProj.sy - 16 * destProj.scale);
      }

      // 6. Draw Moving Technician Vehicle / Beacon
      const techProj = project(techWorld.x, techWorld.y, 8);

      if (techProj.visible) {
        // Pulsing Wave
        const waveRad = ((pulseAngle * 25) % 45) * techProj.scale;
        ctx.beginPath();
        ctx.arc(techProj.sx, techProj.sy, waveRad, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 240, 255, 0.5)";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 3D Directional Service Van / Beacon Icon
        ctx.beginPath();
        ctx.arc(techProj.sx, techProj.sy, 11 * techProj.scale, 0, Math.PI * 2);
        ctx.fillStyle = "#00f0ff";
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Inner Dot
        ctx.beginPath();
        ctx.arc(techProj.sx, techProj.sy, 4 * techProj.scale, 0, Math.PI * 2);
        ctx.fillStyle = "#0e2a2b";
        ctx.fill();

        // Technician Avatar Floating Tag
        ctx.fillStyle = "rgba(14, 42, 43, 0.9)";
        const tagText = `🔧 ${technicianName} (Live GPS)`;
        ctx.font = `600 ${Math.max(10, Math.floor(11 * techProj.scale))}px Inter, sans-serif`;
        const textWidth = ctx.measureText(tagText).width;

        const tagX = techProj.sx - textWidth / 2 - 8;
        const tagY = techProj.sy - 28 * techProj.scale;
        const tagW = textWidth + 16;
        const tagH = 20;

        ctx.beginPath();
        ctx.roundRect(tagX, tagY, tagW, tagH, 6);
        ctx.fill();
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(tagText, techProj.sx, tagY + 14);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    // Mouse drag for 3D rotation
    const onMouseDown = (e: MouseEvent) => {
      if (cameraMode !== "3D") return;
      mouseRef.current.isDragging = true;
      mouseRef.current.lastX = e.clientX;
      mouseRef.current.lastY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!mouseRef.current.isDragging || cameraMode !== "3D") return;
      const dx = e.clientX - mouseRef.current.lastX;
      const dy = e.clientY - mouseRef.current.lastY;

      rotationRef.current.yaw += dx * 0.005;
      rotationRef.current.pitch = Math.max(0.2, Math.min(1.2, rotationRef.current.pitch + dy * 0.005));

      mouseRef.current.lastX = e.clientX;
      mouseRef.current.lastY = e.clientY;
    };

    const onMouseUp = () => {
      mouseRef.current.isDragging = false;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [technicianPos, destinationPos, routePath, currentRouteIndex, cameraMode, isFollowing, accentColor, technicianName]);

  return <canvas ref={canvasRef} className="h-full w-full cursor-grab active:cursor-grabbing" />;
}
