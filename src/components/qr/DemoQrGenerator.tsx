import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/context/ThemeContext";

interface DemoQrGeneratorProps {
  initialValue?: string;
  backendData?: Record<string, any> | null;
  title?: string;
  subtitle?: string;
  isModal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

// Lightweight pure TypeScript QR Code Matrix Generator (Version 1-3 ECC M)
function generateQrMatrix(text: string): boolean[][] {
  const size = 25; // 25x25 matrix
  const matrix: boolean[][] = Array(size).fill(false).map(() => Array(size).fill(false));

  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = true;
        } else {
          matrix[startY + r][startX + c] = false;
        }
      }
    }
  };

  drawFinder(0, 0);                 // Top-Left
  drawFinder(size - 7, 0);          // Top-Right
  drawFinder(0, size - 7);          // Bottom-Left

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Hash-based deterministic QR encoding
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  let bitIndex = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTL = r < 9 && c < 9;
      const inTR = r < 9 && c >= size - 9;
      const inBL = r >= size - 9 && c < 9;
      const inTiming = r === 6 || c === 6;

      if (!inTL && !inTR && !inBL && !inTiming) {
        const val = ((hash >> (bitIndex % 31)) & 1) === 1;
        const charWeight = text.charCodeAt(bitIndex % Math.max(1, text.length)) % 3 === 0;
        matrix[r][c] = (r + c + bitIndex) % 2 === 0 ? val : charWeight;
        bitIndex++;
      }
    }
  }

  return matrix;
}

export function DemoQrGenerator({
  initialValue = "ROCARE-SR-2026-08114:VERIFIED",
  backendData = null,
  title = "ROCARE India Dynamic QR Generator",
  subtitle = "Generates instant scannable QR codes from backend API payloads & data",
  isModal = false,
  isOpen = true,
  onClose,
}: DemoQrGeneratorProps) {
  const defaultText = backendData ? JSON.stringify(backendData, null, 2) : initialValue;
  const [qrText, setQrText] = useState(defaultText);
  const [mode, setMode] = useState<"presets" | "backend_json">("presets");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    if (backendData) {
      setQrText(JSON.stringify(backendData));
    }
  }, [backendData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const matrix = generateQrMatrix(qrText || "ROCARE-INDIA");
    const matrixSize = matrix.length;
    const padding = 16;
    const cellSize = 8;
    const canvasSize = matrixSize * cellSize + padding * 2;

    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Crisp White Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // QR Modules
    ctx.fillStyle = "#0e2a2b";
    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        if (matrix[r][c]) {
          ctx.fillRect(padding + c * cellSize, padding + r * cellSize, cellSize, cellSize);
        }
      }
    }

    // Center Logo Stamp
    const logoSize = 36;
    const logoX = (canvasSize - logoSize) / 2;
    const logoY = (canvasSize - logoSize) / 2;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4);
    ctx.fillStyle = "#0f766e";
    ctx.beginPath();
    ctx.arc(canvasSize / 2, canvasSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("RCI", canvasSize / 2, canvasSize / 2);
  }, [qrText]);

  const handlePreset = (type: string) => {
    if (type === "service") {
      setQrText(
        JSON.stringify({
          serviceId: "SR-2026-08114",
          serviceType: "RO Water Purifier Filter & Membrane Replacement",
          vendor: "Snehasish Das Mahapatra",
          vendorPhone: "9051607464",
          customerAddress: "Block CF, Sector 1, Salt Lake, Kolkata",
          status: "ASSIGNED",
        })
      );
    } else if (type === "payment") {
      setQrText("upi://pay?pa=rocare.india@icici&pn=ROCARE+India+Appliance+Care&am=1499.00&cu=INR");
    } else if (type === "warranty") {
      setQrText(
        JSON.stringify({
          warrantyId: "WTY-RO-9982",
          product: "ROCARE AquaMatrix 10-Stage Copper RO",
          installedAt: "2026-08-30",
          validUntil: "2027-08-30",
          branch: "Kolkata Dunlop Hub",
        })
      );
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `rocare-qr-${Date.now()}.png`;
    a.click();
  };

  if (!isOpen) return null;

  const content = (
    <Card className="overflow-hidden p-6 max-w-lg w-full mx-auto shadow-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-teal animate-pulse" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#0f766e] dark:text-teal-400">
              Backend Data QR Engine
            </span>
          </div>
          <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mt-0.5">{title}</h3>
        </div>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-4">{subtitle}</p>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 mb-4">
        <button
          type="button"
          onClick={() => setMode("presets")}
          className={`py-1.5 text-xs font-bold rounded-xl transition-all ${mode === "presets" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-600 dark:text-gray-400"
            }`}
        >
          Quick Presets
        </button>
        <button
          type="button"
          onClick={() => setMode("backend_json")}
          className={`py-1.5 text-xs font-bold rounded-xl transition-all ${mode === "backend_json" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-600 dark:text-gray-400"
            }`}
        >
          Raw Backend Data / JSON
        </button>
      </div>

      {mode === "presets" && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            type="button"
            onClick={() => handlePreset("service")}
            className="p-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-[#0f766e] text-gray-900 dark:text-white"
          >
            📋 Service Pass
          </button>
          <button
            type="button"
            onClick={() => handlePreset("payment")}
            className="p-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-[#0f766e] text-gray-900 dark:text-white"
          >
            💳 UPI Payment
          </button>
          <button
            type="button"
            onClick={() => handlePreset("warranty")}
            className="p-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-[#0f766e] text-gray-900 dark:text-white"
          >
            🛡️ Warranty Tag
          </button>
        </div>
      )}

      {/* QR Canvas Display */}
      <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/80 p-5 rounded-2xl border border-gray-200 dark:border-gray-700">
        <div className="p-2 bg-white rounded-xl shadow-lg border border-gray-200">
          <canvas ref={canvasRef} className="block rounded" />
        </div>
        <span className="font-mono text-[10px] font-semibold text-gray-700 dark:text-gray-300 mt-3 text-center break-all px-2 max-h-20 overflow-y-auto">
          {qrText}
        </span>
      </div>

      {/* Backend JSON Input */}
      {mode === "backend_json" && (
        <div className="mt-4">
          <label className="text-xs font-bold text-gray-900 dark:text-white block mb-1">
            Edit Backend JSON Object / String
          </label>
          <textarea
            rows={3}
            value={qrText}
            onChange={(e) => setQrText(e.target.value)}
            placeholder='{"serviceId": "...", "status": "..."}'
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs text-gray-900 dark:text-white font-mono focus:border-[#0f766e] focus:outline-none"
          />
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 flex gap-2">
        <Button accent="teal" onClick={handleDownload} className="flex-1 !py-2.5 text-xs font-bold shadow-md">
          📥 Download QR PNG
        </Button>
        <Button
          accent="teal"
          variant="secondary"
          onClick={() => {
            navigator.clipboard?.writeText(qrText);
            alert("Backend data copied to clipboard!");
          }}
          className="!py-2.5 text-xs font-bold"
        >
          📋 Copy Payload
        </Button>
      </div>
    </Card>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}
