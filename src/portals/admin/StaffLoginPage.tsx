import React, { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { adminApi, unwrapList } from "@/lib/apiClient";
import { useStaffAuth } from "@/store/authStore";
import type { ApiSuccessBody } from "@/lib/apiClient";

interface Branch {
  id: string;
  name: string;
  code?: string;
  city?: string;
  state?: string;
}

const DEFAULT_BRANCHES: Branch[] = [
  { id: "branch-kol-dunlop", name: "Dunlop Hub", code: "KOL-DUN", city: "Kolkata", state: "West Bengal" },
  { id: "branch-kol-saltlake", name: "Salt Lake Sector 1", code: "KOL-SL1", city: "Kolkata", state: "West Bengal" },
  { id: "branch-kol-behala", name: "Behala South Hub", code: "KOL-BEH", city: "Kolkata", state: "West Bengal" },
  { id: "branch-howrah", name: "Howrah AC Market", code: "HWH-CTR", city: "Howrah", state: "West Bengal" },
];

export function StaffLoginPage() {
  const navigate = useNavigate();
  const setSession = useStaffAuth((s) => s.setSession);

  // Stepper: 1 = Role selection, 2 = Credentials & Branch selection
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<"SADMIN" | "ADMIN">("ADMIN");

  // Form Fields
  const [branches, setBranches] = useState<Branch[]>(DEFAULT_BRANCHES);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Fetch live active branches from database
  useEffect(() => {
    setLoadingBranches(true);
    adminApi
      .get("/admin/auth/branches")
      .then((res) => {
        const list = unwrapList<Branch>(res.data?.data ?? res.data);
        if (list && list.length > 0) {
          setBranches(list);
          setSelectedBranchId(list[0].id);
        } else {
          setSelectedBranchId(DEFAULT_BRANCHES[0].id);
        }
      })
      .catch(() => {
        setSelectedBranchId(DEFAULT_BRANCHES[0].id);
      })
      .finally(() => {
        setLoadingBranches(false);
      });
  }, []);

  const handleNextStep = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (role === "ADMIN" && branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id);
    }
    setStep(2);
  };

  const handleSubmitLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await adminApi.post<ApiSuccessBody<any>>("/admin/auth/login", {
        email,
        password,
      });

      const rawData = res.data?.data ?? res.data;
      const token = rawData?.accessToken || rawData?.token;
      const user = rawData?.user;

      if (!token) {
        throw new Error("Authentication succeeded but token was missing.");
      }

      setSuccess(true);
      setSession({ token, user });

      setTimeout(() => {
        navigate(user?.role === "SADMIN" ? "/admin/super-admin" : "/admin/dashboard");
      }, 500);
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message ?? "Invalid email or password. Please verify your credentials."
          : err instanceof Error
          ? err.message
          : "Authentication failed. Please check your network connection."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden text-slate-100">
      {/* Minimalist Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/15 via-indigo-600/10 to-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative w-full max-w-[440px] z-10">
        
        {/* Minimalist Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 mb-4 border border-white/10">
            <span className="text-2xl font-bold">🛡️</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Just24You ADMIN PORTAL
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-400 mt-1">
            {step === 1 ? "Select your administrative authorization role" : `Signing in as ${role === "SADMIN" ? "Super Admin" : "Branch Admin"}`}
          </p>
        </div>

        {/* Minimalist Glass Card */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/50">

          {/* Error Banner */}
          {error && (
            <div className="mb-5 rounded-2xl bg-rose-950/70 border border-rose-500/40 p-3.5 text-xs font-semibold text-rose-200 flex items-start gap-2.5 animate-fadeIn">
              <span className="text-sm shrink-0">⚠️</span>
              <p className="leading-snug">{error}</p>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className="mb-5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 p-3.5 text-xs font-semibold text-emerald-200 flex items-center gap-2.5">
              <span className="text-sm shrink-0">✓</span>
              <span>Authentication approved. Redirecting to console...</span>
            </div>
          )}

          {/* ================= STEP 1: ROLE DROPDOWN ONLY ================= */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Select Administrative Role
                </label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as "SADMIN" | "ADMIN")}
                    className="w-full appearance-none rounded-2xl bg-slate-800/90 border border-slate-700 px-4 py-3.5 text-sm font-semibold text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                  >
                    <option value="ADMIN" className="bg-slate-900 text-white py-2">
                      🏢 Branch Admin (Hub Operations &amp; Dispatch)
                    </option>
                    <option value="SADMIN" className="bg-slate-900 text-white py-2">
                      👑 Super Admin (Full Platform &amp; Statewide Management)
                    </option>
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    ▼
                  </div>
                </div>

                <div className="mt-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  <span className="text-base">{role === "SADMIN" ? "👑" : "🏢"}</span>
                  <span>
                    {role === "SADMIN"
                      ? "Global access across all branches, analytics, financial ledger, and administrator accounts."
                      : "Assigned to a specific regional branch hub for localized dispatch, leads, and orders."}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Next Step</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </form>
          )}

          {/* ================= STEP 2: CREDENTIALS & BRANCH ================= */}
          {step === 2 && (
            <form onSubmit={handleSubmitLogin} className="space-y-4">
              {/* Selected Role Indicator & Change Link */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-base">{role === "SADMIN" ? "👑" : "🏢"}</span>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {role === "SADMIN" ? "Super Admin Console" : "Branch Admin Desk"}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {role === "SADMIN" ? "Global Statewide Authority" : "Branch-Scoped Access"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 underline"
                >
                  Change Role
                </button>
              </div>

              {/* Branch Selection Dropdown (Only for Branch Admin) */}
              {role === "ADMIN" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Assigned Branch Hub
                  </label>
                  <div className="relative">
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      disabled={loadingBranches}
                      className="w-full appearance-none rounded-2xl bg-slate-800/90 border border-slate-700 px-4 py-3 text-sm font-semibold text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                          📍 {b.name} ({b.city || "Kolkata"}) {b.code ? `• ${b.code}` : ""}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                      {loadingBranches ? "..." : "▼"}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Your account must be assigned to this branch by Super Admin.
                  </p>
                </div>
              )}

              {/* Username / Email Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === "SADMIN" ? "admin" : "admin.dunlop@just24you.in"}
                    className="w-full rounded-2xl bg-slate-800/90 border border-slate-700 px-4 py-3 pl-10 text-sm font-semibold text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    ✉️
                  </span>
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password / Passkey
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-2xl bg-slate-800/90 border border-slate-700 px-4 py-3 pl-10 pr-11 text-sm font-semibold text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    🔒
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-sm p-1 focus:outline-none"
                  >
                    {showPassword ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Credentials */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Remember Session</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                >
                  Forgot credential?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || success}
                className="w-full mt-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="animate-spin text-base">⏳</span>
                    <span>Validating credentials...</span>
                  </>
                ) : success ? (
                  <>
                    <span>✓ Authorized</span>
                  </>
                ) : (
                  <>
                    <span>Access Dashboard →</span>
                  </>
                )}
              </button>

              {/* Back to Step 1 */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  ← Back to role selection
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Security Badge */}
        <div className="mt-6 text-center text-slate-500 text-xs font-medium">
          🔒 Just24You Administrative Security Gateway • Encrypted Access
        </div>
      </div>

      {/* Forgot Credentials Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <span>🔑</span> Account Recovery &amp; Reset
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Administrative accounts are protected by enterprise security protocols:
              </p>
              <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50 space-y-2">
                <p className="font-bold text-white">For Branch Admins:</p>
                <p className="text-slate-400">
                  Please contact the <strong>Master Super Administrator</strong> or branch supervisor to re-issue temporary login credentials or reset your branch assignment.
                </p>
              </div>

              <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50 space-y-2">
                <p className="font-bold text-white">Master IT Helpdesk:</p>
                <p className="font-mono text-blue-400">admin-support@just24you.in</p>
                <p className="font-mono text-slate-400">+91 90516 07464 (HQ Desk)</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 text-xs transition-colors"
            >
              Understood, Return to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
