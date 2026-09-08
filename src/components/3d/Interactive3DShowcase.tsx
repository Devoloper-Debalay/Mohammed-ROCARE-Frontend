import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "@/context/ThemeContext";

interface ProductModel {
  id: string;
  name: string;
  category: string;
  tagline: string;
  specs: { label: string; value: string }[];
  accentColor: string;
  layers: { name: string; height: number; radius: number; color: string; desc: string }[];
}

const APPLIANCES: ProductModel[] = [
  {
    id: "ro-pro",
    name: "Just24You AquaMatrix 10-Stage RO Purifier",
    category: "RO Purifier",
    tagline: "0.0001µm Reverse Osmosis Membrane with Active Copper, Zinc & TDS Balancer",
    specs: [
      { label: "Purification Capacity", value: "20 Litres/hour" },
      { label: "TDS Reduction", value: "Up to 99.8%" },
      { label: "Storage Tank", value: "10L Food Grade Stainless" },
      { label: "Digital Display", value: "Real-time TDS & Filter Life" },
    ],
    accentColor: "#0f766e",
    layers: [
      { name: "Sediment Filter (5µm)", height: 35, radius: 65, color: "#d97706", desc: "Filters sand, rust, and silt particulates" },
      { name: "Activated Carbon Block", height: 35, radius: 62, color: "#475569", desc: "Absorbs chlorine, pesticides and odors" },
      { name: "0.0001µm RO Membrane", height: 45, radius: 58, color: "#0f766e", desc: "Removes dissolved heavy metals, arsenic and lead" },
      { name: "Copper-Alkaline & UV Lamp", height: 30, radius: 55, color: "#0284c7", desc: "Enriches minerals, balances pH and sterilizes microbes" },
    ],
  },
  {
    id: "ac-smart",
    name: "Just24You FrostWave Dual-Inverter AC (1.5T)",
    category: "Air Conditioner",
    tagline: "100% Grooved Copper Condenser with PM2.5 Anti-Bacterial Nano Filter",
    specs: [
      { label: "Cooling Capacity", value: "1.5 Ton (5 Star BEE)" },
      { label: "Compressor", value: "Twin-Rotary Dual Inverter" },
      { label: "Air Filtration", value: "PM2.5 Micro-Mesh Air Purifier" },
      { label: "Refrigerant", value: "Eco-Safe R32 Gas" },
    ],
    accentColor: "#0284c7",
    layers: [
      { name: "Aero-Dynamic Outer Housing", height: 40, radius: 75, color: "#64748b", desc: "Anti-corrosion acoustic low-noise shell" },
      { name: "100% Copper Condenser Coil", height: 35, radius: 68, color: "#ea580c", desc: "Rapid cooling with grooved copper tubing" },
      { name: "Twin-Rotary Inverter Compressor", height: 40, radius: 60, color: "#0284c7", desc: "Variable frequency power efficiency" },
      { name: "PM2.5 Nano Filtration Grid", height: 25, radius: 52, color: "#059669", desc: "Captures allergens, mold and fine smoke" },
    ],
  },
  {
    id: "fridge-smart",
    name: "Just24You CoolMatrix Frost-Free Refrigerator",
    category: "Refrigerator",
    tagline: "Digital Inverter Multi-Airflow System with Dual Cooling Technology",
    specs: [
      { label: "Capacity", value: "350 Litres Double Door" },
      { label: "Compressor", value: "Smart Digital Inverter (10 Yr Warranty)" },
      { label: "Cooling Tech", value: "360° Multi-Airflow & Frost-Free" },
      { label: "Deodorizer", value: "Active Anti-Bacterial Carbon Filter" },
    ],
    accentColor: "#059669",
    layers: [
      { name: "High-Density PUF Insulated Door", height: 45, radius: 72, color: "#64748b", desc: "Retains sub-zero chill during power cuts" },
      { name: "Multi-Zone Evaporator Core", height: 35, radius: 65, color: "#059669", desc: "Even multi-vent temperature balance" },
      { name: "Digital Inverter Motor", height: 40, radius: 58, color: "#0284c7", desc: "Ultra-quiet variable speed cooling" },
      { name: "Anti-Bacterial Fresh Shield", height: 25, radius: 50, color: "#10b981", desc: "Prevents food spoilage and cross-odors" },
    ],
  },
  {
    id: "geyser-shield",
    name: "Just24You ThermaShield 25L Digital Geyser",
    category: "Water Heater",
    tagline: "Glass-Lined Titanium Tank with Hard Water Anti-Scale Protection",
    specs: [
      { label: "Capacity", value: "25 Litres Storage" },
      { label: "Heating Element", value: "Incoloy 800 Coated 2000W" },
      { label: "Pressure Rating", value: "8 Bar (High Rise Compatible)" },
      { label: "Safety", value: "5-in-1 Multi-Function Safety Valve" },
    ],
    accentColor: "#c2410c",
    layers: [
      { name: "Shock-Proof ABS Outer Body", height: 40, radius: 70, color: "#ea580c", desc: "IPX4 waterproof and rust-free chassis" },
      { name: "High-Density PUF Thermal Wall", height: 30, radius: 64, color: "#f97316", desc: "Long-lasting heat retention" },
      { name: "Titanium Glass Enamel Tank", height: 45, radius: 58, color: "#c2410c", desc: "Withstands hard water scaling & corrosion" },
      { name: "Incoloy Rapid Heating Anode", height: 30, radius: 50, color: "#dc2626", desc: "Instant rapid heating efficiency" },
    ],
  },
];

export function Interactive3DShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductModel>(APPLIANCES[0]);
  const [isExploded, setIsExploded] = useState(true);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [activeLayerIndex, setActiveLayerIndex] = useState<number | null>(null);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const mouseRef = useRef({ isDragging: false, lastX: 0, lastY: 0 });
  const rotationRef = useRef({ yaw: 0.4, pitch: 0.25 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const render = () => {
      time += 0.02;
      if (isAutoRotate && !mouseRef.current.isDragging) {
        rotationRef.current.yaw += 0.006;
      }

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2 - 10;
      const yaw = rotationRef.current.yaw;
      const pitch = rotationRef.current.pitch;
      const focal = 450;

      // 3D Projection helper
      const project = (x: number, y: number, z: number) => {
        const rx = x * Math.cos(yaw) - z * Math.sin(yaw);
        const rz = x * Math.sin(yaw) + z * Math.cos(yaw);

        const ry = y * Math.cos(pitch) - rz * Math.sin(pitch);
        const finalZ = y * Math.sin(pitch) + rz * Math.cos(pitch);

        const scale = focal / (focal + finalZ + 250);
        return {
          sx: cx + rx * scale,
          sy: cy + ry * scale,
          scale,
          z: finalZ,
        };
      };

      // Draw 3D Base Platform Ring
      const basePoints: { sx: number; sy: number; scale: number }[] = [];
      const baseRadius = 110;
      const segments = 32;

      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const bx = Math.cos(theta) * baseRadius;
        const bz = Math.sin(theta) * baseRadius;
        basePoints.push(project(bx, 130, bz));
      }

      ctx.beginPath();
      basePoints.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.sx, p.sy);
        else ctx.lineTo(p.sx, p.sy);
      });
      ctx.strokeStyle = isDark ? "rgba(20, 184, 166, 0.4)" : "rgba(15, 118, 110, 0.3)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Exploded / Assembled 3D Product Layers
      const layers = selectedProduct.layers;
      const layerSpacing = isExploded ? 65 : 28;
      const totalLayers = layers.length;
      const startY = -((totalLayers - 1) * layerSpacing) / 2;

      layers.forEach((layer, idx) => {
        const layerY = startY + idx * layerSpacing;
        const isHovered = activeLayerIndex === idx;
        const radius = layer.radius;
        const h = layer.height;

        const topPts: { sx: number; sy: number }[] = [];
        const botPts: { sx: number; sy: number }[] = [];

        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          const lx = Math.cos(theta) * radius;
          const lz = Math.sin(theta) * radius;

          topPts.push(project(lx, layerY - h / 2, lz));
          botPts.push(project(lx, layerY + h / 2, lz));
        }

        // Cylinder Body Shading
        ctx.fillStyle = isHovered ? `${layer.color}55` : `${layer.color}25`;
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = isHovered ? 3 : 1.5;

        // Draw cylinder side surface
        ctx.beginPath();
        for (let i = 0; i < segments; i++) {
          const t1 = topPts[i];
          const t2 = topPts[i + 1];
          const b1 = botPts[i];
          const b2 = botPts[i + 1];

          ctx.moveTo(t1.sx, t1.sy);
          ctx.lineTo(t2.sx, t2.sy);
          ctx.lineTo(b2.sx, b2.sy);
          ctx.lineTo(b1.sx, b1.sy);
          ctx.closePath();
        }
        ctx.fill();

        // Draw Top Ring
        ctx.beginPath();
        topPts.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.sx, p.sy);
          else ctx.lineTo(p.sx, p.sy);
        });
        ctx.closePath();
        ctx.fillStyle = isHovered ? `${layer.color}77` : `${layer.color}44`;
        ctx.fill();
        ctx.stroke();

        // Draw Bottom Ring
        ctx.beginPath();
        botPts.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.sx, p.sy);
          else ctx.lineTo(p.sx, p.sy);
        });
        ctx.closePath();
        ctx.stroke();

        // Layer Annotation Pin & Label with Ultra-Sharp Contrast
        const labelPos = project(radius + 20, layerY, 0);
        if (isExploded || isHovered) {
          ctx.fillStyle = layer.color;
          ctx.beginPath();
          ctx.arc(labelPos.sx, labelPos.sy, 4 * labelPos.scale, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = layer.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(labelPos.sx, labelPos.sy);
          ctx.lineTo(labelPos.sx + 22 * labelPos.scale, labelPos.sy);
          ctx.stroke();

          // High Contrast Tag Label
          ctx.fillStyle = isDark ? "#ffffff" : "#0b192c";
          ctx.font = `bold ${Math.max(10, Math.floor(12 * labelPos.scale))}px Inter, sans-serif`;
          ctx.textAlign = "left";
          ctx.fillText(layer.name, labelPos.sx + 26 * labelPos.scale, labelPos.sy + 4);
        }
      });

      // Animated 3D Flowing Particles
      const particleCount = 24;
      for (let p = 0; p < particleCount; p++) {
        const pY = ((time * 60 + p * 25) % 220) - 110;
        const pTheta = time * 2 + p * 0.8;
        const pRadius = 16;
        const px = Math.cos(pTheta) * pRadius;
        const pz = Math.sin(pTheta) * pRadius;
        const proj = project(px, pY, pz);

        ctx.fillStyle = "#00f0ff";
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(proj.sx, proj.sy, 3 * proj.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(render);
    };

    render();

    const onMouseDown = (e: MouseEvent) => {
      mouseRef.current.isDragging = true;
      mouseRef.current.lastX = e.clientX;
      mouseRef.current.lastY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!mouseRef.current.isDragging) return;
      const dx = e.clientX - mouseRef.current.lastX;
      const dy = e.clientY - mouseRef.current.lastY;

      rotationRef.current.yaw += dx * 0.008;
      rotationRef.current.pitch = Math.max(-0.4, Math.min(0.6, rotationRef.current.pitch + dy * 0.008));

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
  }, [selectedProduct, isExploded, isAutoRotate, activeLayerIndex, isDark]);

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl transition-all">
      {/* Header with Appliance Switcher */}
      <div className="flex flex-wrap items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50 dark:bg-gray-800/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-teal animate-pulse" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-teal-deep dark:text-teal">
              Just24You India 3D Engineering Lab
            </span>
          </div>
          <h3 className="font-display text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-0.5">
            {selectedProduct.name}
          </h3>
          <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mt-0.5">{selectedProduct.tagline}</p>
        </div>

        {/* Appliance Category Switcher Pills */}
        <div className="flex flex-wrap gap-1.5 bg-white dark:bg-gray-900 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 mt-2 sm:mt-0 shadow-sm">
          {APPLIANCES.map((prod) => (
            <button
              key={prod.id}
              onClick={() => setSelectedProduct(prod)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                selectedProduct.id === prod.id
                  ? "bg-[#0f766e] text-white shadow-md"
                  : "text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {prod.category}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Viewport */}
      <div className="relative h-[320px] sm:h-[400px] w-full bg-gradient-to-b from-transparent to-gray-100/50 dark:to-black/20">
        <canvas ref={canvasRef} className="h-full w-full cursor-grab active:cursor-grabbing" />

        {/* 3D Viewport Controls */}
        <div className="absolute bottom-3 left-4 z-10 flex items-center gap-2">
          <button
            onClick={() => setIsExploded(!isExploded)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold border backdrop-blur-md shadow-sm transition-all ${
              isExploded
                ? "bg-teal-50 dark:bg-teal-950/80 border-teal text-[#0f766e] dark:text-teal"
                : "bg-white/90 dark:bg-gray-800/90 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200"
            }`}
          >
            {isExploded ? "🔍 3D Exploded View" : "📦 Assembled Model"}
          </button>
          <button
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold border backdrop-blur-md shadow-sm transition-all ${
              isAutoRotate
                ? "bg-teal-50 dark:bg-teal-950/80 border-teal text-[#0f766e] dark:text-teal"
                : "bg-white/90 dark:bg-gray-800/90 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200"
            }`}
          >
            {isAutoRotate ? "⏸️ Pause 3D Spin" : "▶️ 3D Spin"}
          </button>
        </div>

        <div className="pointer-events-none absolute top-3 right-4 rounded-lg bg-white/90 dark:bg-gray-900/90 px-3 py-1 text-xs font-mono font-semibold text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-sm backdrop-blur-sm">
          Drag to rotate 3D view
        </div>
      </div>

      {/* Layer Specs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
        {selectedProduct.layers.map((layer, idx) => (
          <div
            key={layer.name}
            onMouseEnter={() => setActiveLayerIndex(idx)}
            onMouseLeave={() => setActiveLayerIndex(null)}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              activeLayerIndex === idx
                ? "bg-white dark:bg-gray-900 border-[#0f766e] shadow-md ring-2 ring-[#0f766e]/20"
                : "bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-700 hover:border-gray-400"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: layer.color }} />
              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{layer.name}</p>
            </div>
            <p className="text-[11px] text-gray-700 dark:text-gray-300 mt-1 font-medium leading-relaxed">
              {layer.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
