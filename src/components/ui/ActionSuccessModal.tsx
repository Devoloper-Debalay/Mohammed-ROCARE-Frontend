import React, { useEffect } from "react";

export interface ActionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: "ACCEPT" | "DENY" | "COMPLETE" | "CREATE";
  title: string;
  message: string;
  leadId?: string;
  subDetail?: string;
}

export function ActionSuccessModal({
  isOpen,
  onClose,
  type = "ACCEPT",
  title,
  message,
  leadId,
  subDetail,
}: ActionSuccessModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isComplete = type === "COMPLETE";
  const isDeny = type === "DENY";
  const isAccept = type === "ACCEPT";

  const icon = isComplete ? "🎉" : isDeny ? "🚫" : isAccept ? "⚡" : "✨";
  const gradient = isComplete
    ? "from-emerald-600 via-teal-700 to-slate-900"
    : isDeny
    ? "from-rose-600 via-rose-800 to-slate-900"
    : "from-blue-600 via-indigo-700 to-slate-900";

  const glowColor = isComplete
    ? "shadow-emerald-500/20 border-emerald-500/40"
    : isDeny
    ? "shadow-rose-500/20 border-rose-500/40"
    : "shadow-blue-500/20 border-blue-500/40";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-3xl border bg-gradient-to-b ${gradient} p-7 text-white shadow-2xl ${glowColor} transition-all scale-100 animate-scaleUp`}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center text-sm font-bold transition-all"
        >
          ✕
        </button>

        <div className="flex flex-col items-center text-center space-y-3">
          {/* Animated Icon Avatar */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 text-3xl shadow-inner animate-bounce">
            {icon}
          </div>

          <div>
            <h3 className="text-xl font-black tracking-tight text-white">{title}</h3>
            {leadId && (
              <p className="mt-1 font-mono text-xs font-bold text-white/70 uppercase tracking-wider">
                Lead #{leadId}
              </p>
            )}
          </div>

          <p className="text-xs text-white/90 font-medium leading-relaxed max-w-xs">
            {message}
          </p>

          {subDetail && (
            <div className="w-full rounded-2xl bg-black/25 backdrop-blur-md p-3 border border-white/10 text-left text-xs font-medium text-white/80">
              {subDetail}
            </div>
          )}

          <div className="pt-2 w-full flex gap-2">
            <button
              onClick={onClose}
              className="w-full rounded-2xl bg-white text-slate-900 hover:bg-white/90 py-2.5 px-4 text-xs font-black shadow-lg transition-all active:scale-95"
            >
              Continue Working →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
