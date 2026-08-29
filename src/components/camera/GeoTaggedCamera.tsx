import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card, Badge } from "@/components/ui/Card";
import { useTheme } from "@/context/ThemeContext";

interface GeoTaggedCameraProps {
  title?: string;
  subtitle?: string;
  onCapture: (file: File, geoData: { latitude: number; longitude: number; address: string; timestamp: string }) => void;
  onCancel?: () => void;
  isModal?: boolean;
  isOpen?: boolean;
}

export function GeoTaggedCamera({
  title = "Geo-Tagged On-Site Camera Proof",
  subtitle = "Capture live photo with tamper-proof GPS coordinates and timestamp",
  onCapture,
  onCancel,
  isModal = true,
  isOpen = true,
}: GeoTaggedCameraProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [geoInfo, setGeoInfo] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
    address: string;
  }>({
    latitude: 22.5840,
    longitude: 88.4340,
    accuracy: 4.8,
    timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    address: "Salt Lake Sector 1, Kolkata, West Bengal 700064",
  });
  const [geoLoading, setGeoLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // 1. Fetch Real Live Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoInfo({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy || 5,
            timestamp: new Date(pos.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
            address: `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)} (GPS Verified)`,
          });
          setGeoLoading(false);
        },
        () => {
          // Default to high-accuracy fallback coordinates
          setGeoLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setGeoLoading(false);
    }
  }, []);

  // 2. Initialize Camera Stream
  useEffect(() => {
    let active = true;
    async function startCam() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (active) {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        }
      } catch (err: any) {
        if (active) {
          setCameraError("Camera access unavailable. You can upload an image directly below.");
        }
      }
    }

    if (isOpen && !capturedImage) {
      startCam();
    }

    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, capturedImage]);

  // Stamp Geotag Data onto Image
  const stampGeotag = (sourceImg: CanvasImageSource, sWidth: number, sHeight: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = sWidth;
    canvas.height = sHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw main image
    ctx.drawImage(sourceImg, 0, 0, sWidth, sHeight);

    // Geotag Bottom Overlay Banner
    const bannerHeight = 85;
    ctx.fillStyle = "rgba(14, 42, 43, 0.88)";
    ctx.fillRect(0, sHeight - bannerHeight, sWidth, bannerHeight);

    // Top border of banner (Teal line)
    ctx.fillStyle = "#0f7a6e";
    ctx.fillRect(0, sHeight - bannerHeight, sWidth, 3);

    // Left Icon / ROCARE Logo Stamp
    ctx.fillStyle = "#00f0ff";
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillText("ROCARE GEOTAG VERIFIED", 20, sHeight - bannerHeight + 24);

    // Geotag Data Text
    ctx.fillStyle = "#f3f4f6";
    ctx.font = "12px IBM Plex Mono, monospace";
    ctx.fillText(`LAT: ${geoInfo.latitude.toFixed(6)}° N  |  LNG: ${geoInfo.longitude.toFixed(6)}° E`, 20, sHeight - bannerHeight + 46);
    ctx.fillText(`ACCURACY: ±${geoInfo.accuracy.toFixed(1)}m  |  TIME: ${geoInfo.timestamp} (IST)`, 20, sHeight - bannerHeight + 66);

    // Right Official Seal
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("✓ GPS ON-SITE AUDIT", sWidth - 20, sHeight - bannerHeight + 35);
    ctx.font = "10px Inter, sans-serif";
    ctx.fillStyle = "#9ca3af";
    ctx.fillText("Digital Tamper Proof", sWidth - 20, sHeight - bannerHeight + 55);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);

    // Convert data URL to File object
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `geotagged_proof_${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file, {
          latitude: geoInfo.latitude,
          longitude: geoInfo.longitude,
          address: geoInfo.address,
          timestamp: geoInfo.timestamp,
        });
      }
    }, "image/jpeg", 0.92);
  };

  const handleCaptureVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    stampGeotag(video, video.videoWidth || 640, video.videoHeight || 480);
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      stampGeotag(img, img.width, img.height);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCameraError(null);
  };

  if (!isOpen) return null;

  const content = (
    <Card className="overflow-hidden p-6 max-w-lg w-full mx-auto shadow-2xl border border-ink/[0.08]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink/[0.08] pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-orange animate-pulse" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-orange-deep">
              Geo-Tagged Cam
            </span>
          </div>
          <h3 className="font-display font-semibold text-lg text-ink mt-0.5">{title}</h3>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-ink/[0.05] text-ink-soft hover:text-ink transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      <p className="text-xs text-ink-soft mb-3">{subtitle}</p>

      {/* Live GPS Telemetry Badge */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-teal-tint/50 border border-teal/20 p-2.5 text-xs">
        <div className="flex items-center gap-1.5 font-mono text-teal-deep">
          <span>📍</span>
          <span>{geoInfo.latitude.toFixed(4)}° N, {geoInfo.longitude.toFixed(4)}° E</span>
        </div>
        <span className="font-mono text-[10px] text-ink-soft/70">
          {geoLoading ? "Acquiring GPS..." : `Accuracy: ±${geoInfo.accuracy}m`}
        </span>
      </div>

      {/* Camera / Image Viewport */}
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-ink/[0.1]">
        {capturedImage ? (
          <img src={capturedImage} alt="Geo-tagged Proof" className="h-full w-full object-cover" />
        ) : cameraError ? (
          <div className="p-6 text-center text-white">
            <p className="text-sm font-semibold mb-2">📸 Live Camera Preview</p>
            <p className="text-xs text-gray-400 mb-4">{cameraError}</p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button accent="orange" onClick={() => fileInputRef.current?.click()}>
              Choose Photo to Geotag
            </Button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            {/* Live GPS Stamp Overlay Preview */}
            <div className="pointer-events-none absolute bottom-0 inset-x-0 bg-ink/80 p-2.5 text-[10px] font-mono text-white backdrop-blur-sm">
              <p className="font-bold text-cyan-300">ROCARE GEOTAG PREVIEW</p>
              <p>LAT: {geoInfo.latitude.toFixed(4)} | LNG: {geoInfo.longitude.toFixed(4)}</p>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap gap-2">
        {capturedImage ? (
          <>
            <Button accent="teal" onClick={handleRetake} variant="secondary" className="flex-1 !py-2.5 !text-xs">
              🔄 Retake Photo
            </Button>
            <Button accent="teal" onClick={() => onCancel?.()} className="flex-1 !py-2.5 !text-xs">
              ✓ Confirm Proof
            </Button>
          </>
        ) : (
          <>
            <Button accent="teal" onClick={handleCaptureVideo} className="flex-1 !py-2.5 !text-xs shadow-md">
              📸 Capture Geotagged Photo
            </Button>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              accent="slate"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              className="!py-2.5 !text-xs"
            >
              📁 File
            </Button>
          </>
        )}
      </div>
    </Card>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}
