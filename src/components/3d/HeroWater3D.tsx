import React, { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  color: string;
  stage: number;
  alpha: number;
}

export function HeroWater3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeStageIndex, setActiveStageIndex] = useState(2);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  const stages = [
    { name: "Sediment Filter", color: "#d4a94c", desc: "Coarse particulates removed" },
    { name: "Carbon Block", color: "#3b4a4a", desc: "Chemicals & chlorine treated" },
    { name: "RO Membrane", color: "#0f7a6e", desc: "99.8% microscopic filtration (0.0001µm)" },
    { name: "Mineralization", color: "#00f0ff", desc: "Essential minerals balanced" },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particle pool for 3D flow
    const particleCount = 85;
    const particles: Particle[] = [];

    const colors = ["#ff6b35", "#d4a94c", "#0f7a6e", "#00f0ff"];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 260,
        y: -180 + Math.random() * 360,
        z: (Math.random() - 0.5) * 260,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 1.2 + Math.random() * 1.8,
        vz: (Math.random() - 0.5) * 0.4,
        radius: 2 + Math.random() * 3.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        stage: Math.floor(Math.random() * 4),
        alpha: 0.3 + Math.random() * 0.7,
      });
    }

    let angleY = 0;
    let angleX = 0.2;

    const render = () => {
      // Smooth mouse parallax
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      angleY += 0.008 + mouseRef.current.x * 0.0005;
      angleX = 0.18 + mouseRef.current.y * 0.0004;

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2 - 10;
      const focalLength = 320;

      // 1. Draw 3D Cylindrical Filtration Chambers (Holographic Rings)
      const ringCount = 4;
      const ringRadius = 110;
      const ringHeights = [-120, -40, 40, 120];

      for (let r = 0; r < ringCount; r++) {
        const ry = ringHeights[r];
        const ringSegments = 36;
        const pts: { x: number; y: number; z: number; sx: number; sy: number }[] = [];

        for (let s = 0; s <= ringSegments; s++) {
          const theta = (s / ringSegments) * Math.PI * 2;
          const rx = Math.cos(theta) * ringRadius;
          const rz = Math.sin(theta) * ringRadius;

          // Rotate around X and Y
          const x1 = rx * Math.cos(angleY) + rz * Math.sin(angleY);
          const z1 = -rx * Math.sin(angleY) + rz * Math.cos(angleY);

          const y2 = ry * Math.cos(angleX) - z1 * Math.sin(angleX);
          const z2 = ry * Math.sin(angleX) + z1 * Math.cos(angleX);

          const scale = focalLength / (focalLength + z2 + 100);
          pts.push({
            x: x1,
            y: y2,
            z: z2,
            sx: centerX + x1 * scale,
            sy: centerY + y2 * scale,
          });
        }

        // Draw ring path
        ctx.beginPath();
        pts.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.sx, p.sy);
          else ctx.lineTo(p.sx, p.sy);
        });
        ctx.closePath();

        const isCurrent = r === activeStageIndex;
        ctx.strokeStyle = isCurrent ? stages[r].color : "rgba(14, 42, 43, 0.15)";
        ctx.lineWidth = isCurrent ? 3 : 1.5;
        if (isCurrent) {
          ctx.shadowColor = stages[r].color;
          ctx.shadowBlur = 14;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw node markers on the ring
        for (let n = 0; n < pts.length - 1; n += 9) {
          const pt = pts[n];
          const scale = focalLength / (focalLength + pt.z + 100);
          ctx.fillStyle = isCurrent ? "#00f0ff" : "rgba(15, 122, 110, 0.4)";
          ctx.beginPath();
          ctx.arc(pt.sx, pt.sy, (isCurrent ? 4 : 2.5) * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Draw 3D Central Core Axis Line
      const topY = -150;
      const botY = 150;
      const topScale = focalLength / (focalLength + topY * Math.sin(angleX) + 100);
      const botScale = focalLength / (focalLength + botY * Math.sin(angleX) + 100);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY + topY * Math.cos(angleX) * topScale);
      ctx.lineTo(centerX, centerY + botY * Math.cos(angleX) * botScale);
      ctx.strokeStyle = "rgba(0, 240, 255, 0.25)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Render 3D Water Flow Particles
      particles.sort((a, b) => b.z - a.z); // Depth sorting

      particles.forEach((p) => {
        // Move particle downwards through filter stages
        p.y += p.vy;
        p.x += p.vx;
        p.z += p.vz;

        // Reset particle to top
        if (p.y > 160) {
          p.y = -160;
          p.x = (Math.random() - 0.5) * 120;
          p.z = (Math.random() - 0.5) * 120;
        }

        // Color transition based on depth through filtration
        if (p.y < -50) {
          p.color = "#ff6b35"; // Raw
        } else if (p.y < 30) {
          p.color = "#d4a94c"; // Carbon
        } else if (p.y < 100) {
          p.color = "#0f7a6e"; // RO
        } else {
          p.color = "#00f0ff"; // Pure
        }

        // 3D rotation projection
        const x1 = p.x * Math.cos(angleY) + p.z * Math.sin(angleY);
        const z1 = -p.x * Math.sin(angleY) + p.z * Math.cos(angleY);

        const y2 = p.y * Math.cos(angleX) - z1 * Math.sin(angleX);
        const z2 = p.y * Math.sin(angleX) + z1 * Math.cos(angleX);

        const scale = focalLength / (focalLength + z2 + 100);
        const screenX = centerX + x1 * scale;
        const screenY = centerY + y2 * scale;
        const rad = Math.max(1, p.radius * scale);

        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(screenX, screenY, rad, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * Math.min(1, scale);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8 * scale;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.targetX = e.clientX - rect.left - rect.width / 2;
      mouseRef.current.targetY = e.clientY - rect.top - rect.height / 2;
    };

    window.addEventListener("mousemove", onMouseMove);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [activeStageIndex]);

  return (
    <div className="relative flex flex-col items-center justify-center rounded-3xl border border-ink/[0.08] bg-gradient-to-b from-surface via-surface/95 to-base p-6 shadow-[0_20px_60px_-15px_rgba(14,42,43,0.15)] backdrop-blur-xl">
      {/* Top HUD Badge */}
      <div className="flex w-full items-center justify-between border-b border-ink/[0.06] pb-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal"></span>
          </span>
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-teal-deep">
            3D Molecular Stage Simulation
          </span>
        </div>
        <span className="font-mono text-xs font-bold text-ink-soft/70">RO-CORE 3D</span>
      </div>

      {/* 3D Interactive Canvas */}
      <div className="relative h-72 w-full sm:h-80">
        <canvas ref={canvasRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
        <div className="pointer-events-none absolute bottom-2 left-2 rounded-lg bg-surface/80 px-2.5 py-1 text-[11px] font-mono text-ink-soft/70 backdrop-blur-sm border border-ink/[0.06]">
          Interactive 3D • Move cursor to rotate
        </div>
      </div>

      {/* Stage Tabs / Switcher */}
      <div className="mt-3 grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
        {stages.map((stage, idx) => {
          const isActive = idx === activeStageIndex;
          return (
            <button
              key={stage.name}
              onClick={() => setActiveStageIndex(idx)}
              className={`flex flex-col items-start rounded-xl p-2.5 text-left transition-all border ${
                isActive
                  ? "border-teal bg-teal-tint shadow-sm ring-2 ring-teal/20"
                  : "border-ink/[0.06] bg-surface/60 hover:bg-base"
              }`}
            >
              <div className="flex items-center gap-1.5 w-full">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft/60">
                  Stage {idx + 1}
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold text-ink truncate w-full">{stage.name}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-3 w-full rounded-xl bg-ink/[0.03] px-3.5 py-2 text-xs text-ink-soft">
        <span className="font-semibold text-ink">{stages[activeStageIndex].name}:</span>{" "}
        {stages[activeStageIndex].desc}
      </div>
    </div>
  );
}
