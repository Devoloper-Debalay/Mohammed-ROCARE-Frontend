import React, { type FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { adminApi } from "@/lib/apiClient";
import { useStaffAuth } from "@/store/authStore";
import type { ApiSuccessBody } from "@/lib/apiClient";
import "./retro-future.css";

export function StaffLoginPage() {
  const navigate = useNavigate();
  const setSession = useStaffAuth((s) => s.setSession);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminApi.post<ApiSuccessBody<any>>("/admin/auth/login", { email, password });
      const rawData = res.data?.data ?? res.data;
      const token = rawData?.accessToken || rawData?.token;
      const user = rawData?.user;
      if (!token) {
        throw new Error("Access key missing in mainframe response.");
      }
      setSuccess(true);
      setSession({ token, user });
      
      setTimeout(() => {
        navigate(user?.role === "SADMIN" ? "/staff/super-admin" : "/staff/dashboard");
      }, 700);
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message ?? "ACCESS DENIED: Invalid administrator credentials."
          : err instanceof Error
          ? err.message
          : "MAINFRAME ERROR: Authentication rejected."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (role: "SADMIN" | "ADMIN") => {
    if (role === "SADMIN") {
      setEmail("superadmin@rocare.in");
      setPassword("Admin@1234");
    } else {
      setEmail("admin.dunlop@rocare.in");
      setPassword("Admin@1234");
    }
    setError("");
  };

  return (
    <div className="retro-bg-container flex items-center justify-center p-4 sm:p-6 font-mono text-white select-none">
      {/* Background Retro Grid & Scanner Lasers */}
      <div className="y2k-grid pointer-events-none" />
      <div className="grid-dots pointer-events-none" />
      
      <div className="scanner-lines pointer-events-none">
        <div className="scan-line scan-1" />
        <div className="scan-line scan-2" />
        <div className="scan-line scan-3" />
      </div>

      {/* Floating Retro Orbs */}
      <div className="floating-orbs pointer-events-none">
        <div className="retro-orb orb-1" />
        <div className="retro-orb orb-2" />
        <div className="retro-orb orb-3" />
      </div>

      {/* Main Login Hologram Card Container */}
      <div className="relative w-full max-w-[460px] z-10">
        <div className="future-card">
          
          {/* Chrome Header & Rotating Emblem */}
          <div className="text-center mb-6">
            <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <div className="chrome-glow" />
              <div className="logo-chrome">
                <div className="chrome-inner text-2xl font-black text-slate-900">
                  ⚡
                </div>
              </div>
            </div>

            <h1 className="font-display text-3xl font-black tracking-widest uppercase flex items-center justify-center gap-2">
              <span className="title-chrome">ROCARE</span>
              <span className="title-neon">FUTURE</span>
            </h1>
            <p className="text-[11px] font-bold tracking-[3px] text-cyan-300 uppercase mt-1">
              Admin &amp; Super-Admin Mainframe Console
            </p>
          </div>

          {/* Cyber Quick Demo Credentials Bar */}
          <div className="mb-6 rounded-2xl bg-black/40 border border-cyan-500/30 p-2.5 text-center backdrop-blur-md">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-cyan-400 block mb-1.5">
              ⚡ FAST ACCESS PRESETS
            </span>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("SADMIN")}
                className="px-3 py-1 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/40 hover:to-purple-500/40 text-pink-300 border border-pink-500/40 text-[10px] font-black uppercase tracking-wider transition-all shadow-sm"
              >
                👑 SUPER ADMIN
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("ADMIN")}
                className="px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/40 hover:to-blue-500/40 text-cyan-300 border border-cyan-500/40 text-[10px] font-black uppercase tracking-wider transition-all shadow-sm"
              >
                🏢 BRANCH ADMIN
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 rounded-2xl bg-rose-950/80 border border-rose-500/60 p-3.5 text-[11px] font-bold text-rose-300 flex items-center gap-2.5 shadow-lg shadow-rose-900/40 animate-pulse">
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-5 rounded-2xl bg-emerald-950/80 border border-cyan-400 p-3.5 text-[11px] font-bold text-cyan-300 flex items-center gap-2.5 shadow-lg shadow-cyan-900/40">
              <span className="text-base">✓</span>
              <span>ACCESS GRANTED • Initializing digital interface...</span>
            </div>
          )}

          {/* Main Retro Form */}
          <form onSubmit={submit} className="space-y-4">
            
            {/* Business Email Field */}
            <div className="field-chrome">
              <div className="chrome-border" />
              <div className="relative z-10">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=" "
                  className="w-full bg-transparent border-none px-4 py-4 text-xs font-bold text-white uppercase tracking-wider outline-none placeholder-transparent"
                />
                <label className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold uppercase tracking-wider pointer-events-none transition-all">
                  {email ? "" : "ADMIN EMAIL"}
                </label>
              </div>
              <div className="field-hologram" />
            </div>

            {/* Password Field */}
            <div className="field-chrome">
              <div className="chrome-border" />
              <div className="relative z-10 flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=" "
                  className="w-full bg-transparent border-none px-4 py-4 pr-12 text-xs font-bold text-white tracking-wider outline-none placeholder-transparent"
                />
                <label className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold uppercase tracking-wider pointer-events-none transition-all">
                  {password ? "" : "ACCESS CODE / PASSWORD"}
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-cyan-400 hover:text-cyan-200 text-base p-1 focus:outline-none transition-colors"
                >
                  {showPassword ? "👁️" : "🔒"}
                </button>
              </div>
              <div className="field-hologram" />
            </div>

            {/* Remember & Recovery Options */}
            <div className="flex items-center justify-between text-[11px] pt-1 font-bold">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-cyan-500/50 bg-slate-900 text-cyan-500 focus:ring-cyan-400"
                />
                <span>REMEMBER SESSION</span>
              </label>
              <span className="text-pink-400 hover:text-pink-300 cursor-pointer underline">
                RECOVER ACCESS
              </span>
            </div>

            {/* Retro Futuristic Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="retro-button mt-4"
            >
              <div className="button-chrome" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <span className="animate-spin text-lg">⚙️</span>
                    <span>INITIALIZING MAINFRAME...</span>
                  </>
                ) : success ? (
                  <>
                    <span>✓ ACCESS CONFIRMED</span>
                  </>
                ) : (
                  <>
                    <span>ENTER THE FUTURE →</span>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Retro Divider */}
          <div className="retro-divider">
            <div className="divider-chrome" />
            <span className="text-[9px] font-black uppercase tracking-[2px] text-cyan-400">
              OR CONNECT VIA
            </span>
            <div className="divider-chrome" />
          </div>

          {/* Future Social & Portals */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/customer/login"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/30 bg-black/40 hover:bg-cyan-500/20 py-2.5 text-[10px] font-black uppercase tracking-wider text-cyan-300 transition-all text-center"
            >
              <span>👤</span> CUSTOMER
            </Link>
            <Link
              to="/vendor/login"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-pink-500/30 bg-black/40 hover:bg-pink-500/20 py-2.5 text-[10px] font-black uppercase tracking-wider text-pink-300 transition-all text-center"
            >
              <span>🛵</span> TECHNICIAN
            </Link>
          </div>

          {/* Security Subtext */}
          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              🔒 256-BIT QUANTUM ENCRYPTED • ROCARE v4.9
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
