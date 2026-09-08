import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleMapsTracker } from "@/components/tracking/GoogleMapsTracker";
import { vendorApi, unwrapList } from "@/lib/apiClient";
import { useVendorAuth } from "@/store/authStore";

interface Wallet {
  balance: number | string;
}

export interface Lead {
  id: string;
  leadCode?: string | number;
  customerName: string;
  phone?: string;
  address?: string;
  area?: string;
  serviceType?: string;
  status: string;
  leadAcceptanceCharge?: string | number;
  estimatedAmount?: string | number;
}

export function VendorDashboardPage() {
  const navigate = useNavigate();
  const user = useVendorAuth((s) => s.user);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showNavModal, setShowNavModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // MLM Network Stats - Strictly Realtime
  const [downlineCount, setDownlineCount] = useState<number>(0);
  const [l1Commissions, setL1Commissions] = useState<number>(0);
  const [l2Commissions, setL2Commissions] = useState<number>(0);

  useEffect(() => {
    Promise.allSettled([
      vendorApi.get("/vendor/wallet"),
      vendorApi.get("/vendor/leads"),
      vendorApi.get("/vendor/notifications"),
      vendorApi.get("/mlm/stats").catch(() => null),
    ]).then(([w, l, n, m]) => {
      if (w.status === "fulfilled") {
        const wData = w.value.data?.data ?? w.value.data;
        if (wData) setWallet(wData);
      }
      if (l.status === "fulfilled") {
        const list = unwrapList<Lead>(l.value.data?.data ?? l.value.data);
        setLeads(list);
      }
      if (n.status === "fulfilled") {
        const nList = unwrapList<any>(n.value.data?.data ?? n.value.data);
        const unread = nList.filter((item: any) => !item.isRead).length;
        setUnreadNotifications(unread);
      }
      if (m && m.status === "fulfilled" && m.value?.data) {
        const mData = m.value.data?.data ?? m.value.data;
        if (mData.totalDownline !== undefined) setDownlineCount(Number(mData.totalDownline));
        if (mData.directBonus !== undefined) setL1Commissions(Number(mData.directBonus));
        if (mData.teamOverride !== undefined) setL2Commissions(Number(mData.teamOverride));
      }
      setLoading(false);
    });
  }, []);

  const vendorDisplayName = user?.fullName || "Technician";
  const vendorCodeDisplay = user?.vendorCode || (user?.id ? `ven-${user.id.slice(0, 8)}` : "ven-technician");
  const walletCoins = wallet?.balance !== undefined ? String(wallet.balance) : "0";
  const referralCode = (user as any)?.referralCode || vendorCodeDisplay.toUpperCase();

  // Completed leads count strictly from realtime data
  const completedLeadsCount = leads.filter((l) => l.status === "COMPLETED").length;

  // Technician Tier Badge based on completed jobs
  const getTechnicianTier = (completed: number) => {
    if (completed >= 75) {
      return {
        rank: "Master Distributor / Elite Partner",
        icon: "🏆",
        color: "bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-800",
        nextTarget: 100,
      };
    }
    if (completed >= 30) {
      return {
        rank: "Team Lead / Gold Partner",
        icon: "👑",
        color: "bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800",
        nextTarget: 75,
      };
    }
    if (completed >= 10) {
      return {
        rank: "Active Sponsor / Silver Partner",
        icon: "⭐",
        color: "bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-800",
        nextTarget: 30,
      };
    }
    return {
      rank: "Level-1 Certified Pro",
      icon: "🛡️",
      color: "bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800",
      nextTarget: 10,
    };
  };

  const techTier = getTechnicianTier(completedLeadsCount);

  // Find active ongoing or accepted lead for live navigation
  const activeJob = leads.find((l) => l.status === "ONGOING" || l.status === "ACCEPTED");

  // Grid Action Buttons matching modern vibrant status palettes
  const quickActions = [
    {
      id: "new-leads",
      title: "New Leads",
      path: "/vendor/leads?status=NEW",
      bgClass: "bg-blue-500/15 hover:bg-blue-500/25 dark:bg-blue-950/70 dark:hover:bg-blue-900/80 border-blue-300/50 dark:border-blue-700/60 shadow-blue-500/10",
      textClass: "text-blue-600 dark:text-blue-400",
      hoverText: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8L12 2zm0 4.5v5.5m0 2.5v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: "accepted-lead",
      title: "Accepted Lead",
      path: "/vendor/leads?status=ACCEPTED",
      bgClass: "bg-emerald-500/15 hover:bg-emerald-500/25 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/80 border-emerald-300/50 dark:border-emerald-700/60 shadow-emerald-500/10",
      textClass: "text-emerald-600 dark:text-emerald-400",
      hoverText: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      ),
    },
    {
      id: "ongoing-lead",
      title: "Ongoing Lead",
      path: "/vendor/leads?status=ONGOING",
      bgClass: "bg-amber-500/15 hover:bg-amber-500/25 dark:bg-amber-950/70 dark:hover:bg-amber-900/80 border-amber-300/50 dark:border-amber-700/60 shadow-amber-500/10",
      textClass: "text-amber-600 dark:text-amber-400",
      hoverText: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      id: "completed-leads",
      title: "Completed Leads",
      path: "/vendor/leads?status=COMPLETED",
      bgClass: "bg-teal-500/15 hover:bg-teal-500/25 dark:bg-teal-950/70 dark:hover:bg-teal-900/80 border-teal-300/50 dark:border-teal-700/60 shadow-teal-500/10",
      textClass: "text-teal-600 dark:text-teal-400",
      hoverText: "group-hover:text-teal-600 dark:group-hover:text-teal-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7M9 13l4 4L23 7" />
        </svg>
      ),
    },
    {
      id: "denied-leads",
      title: "Denied Leads",
      path: "/vendor/leads?status=DENIED",
      bgClass: "bg-rose-500/15 hover:bg-rose-500/25 dark:bg-rose-950/70 dark:hover:bg-rose-900/80 border-rose-300/50 dark:border-rose-700/60 shadow-rose-500/10",
      textClass: "text-rose-600 dark:text-rose-400",
      hoverText: "group-hover:text-rose-600 dark:group-hover:text-rose-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    {
      id: "mlm-network",
      title: "MLM Network",
      path: "/vendor/profile#mlm-network",
      bgClass: "bg-indigo-500/15 hover:bg-indigo-500/25 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/80 border-indigo-300/50 dark:border-indigo-700/60 shadow-indigo-500/10",
      textClass: "text-indigo-600 dark:text-indigo-400",
      hoverText: "group-hover:text-indigo-600 dark:group-hover:text-indigo-400",
      icon: (
        <span className="text-2xl">🌐</span>
      ),
    },
    {
      id: "my-account",
      title: "My Account",
      path: "/vendor/profile",
      bgClass: "bg-sky-500/15 hover:bg-sky-500/25 dark:bg-sky-950/70 dark:hover:bg-sky-900/80 border-sky-300/50 dark:border-sky-700/60 shadow-sky-500/10",
      textClass: "text-sky-600 dark:text-sky-400",
      hoverText: "group-hover:text-sky-600 dark:group-hover:text-sky-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: "recharge",
      title: "Recharge",
      path: "/vendor/wallet",
      bgClass: "bg-yellow-500/15 hover:bg-yellow-500/25 dark:bg-yellow-950/70 dark:hover:bg-yellow-900/80 border-yellow-300/50 dark:border-yellow-700/60 shadow-yellow-500/10",
      textClass: "text-yellow-600 dark:text-yellow-400",
      hoverText: "group-hover:text-yellow-600 dark:group-hover:text-yellow-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="6" width="18" height="13" rx="2" strokeLinecap="round"/>
          <path d="M16 12.5a1 1 0 100-2 1 1 0 000 2z" fill="currentColor"/>
          <path d="M7 6V4a2 2 0 012-2h6a2 2 0 012 2v2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: "products",
      title: "Products",
      path: "/vendor/products?tab=products",
      bgClass: "bg-purple-500/15 hover:bg-purple-500/25 dark:bg-purple-950/70 dark:hover:bg-purple-900/80 border-purple-300/50 dark:border-purple-700/60 shadow-purple-500/10",
      textClass: "text-purple-600 dark:text-purple-400",
      hoverText: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="12" r="3" fill="currentColor"/>
        </svg>
      ),
    },
    {
      id: "parts",
      title: "Parts",
      path: "/vendor/products?tab=parts",
      bgClass: "bg-cyan-500/15 hover:bg-cyan-500/25 dark:bg-cyan-950/70 dark:hover:bg-cyan-900/80 border-cyan-300/50 dark:border-cyan-700/60 shadow-cyan-500/10",
      textClass: "text-cyan-600 dark:text-cyan-400",
      hoverText: "group-hover:text-cyan-600 dark:group-hover:text-cyan-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="8" strokeWidth="2"/>
          <circle cx="12" cy="12" r="3" fill="currentColor"/>
          <path d="M12 2v2m0 16v2m10-10h-2M4 12H2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: "complaint",
      title: "Complaint",
      path: "/vendor/complaints",
      bgClass: "bg-orange-500/15 hover:bg-orange-500/25 dark:bg-orange-950/70 dark:hover:bg-orange-900/80 border-orange-300/50 dark:border-orange-700/60 shadow-orange-500/10",
      textClass: "text-orange-600 dark:text-orange-400",
      hoverText: "group-hover:text-orange-600 dark:group-hover:text-orange-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
    {
      id: "offers",
      title: "Offers",
      path: "/vendor/offers",
      bgClass: "bg-pink-500/15 hover:bg-pink-500/25 dark:bg-pink-950/70 dark:hover:bg-pink-900/80 border-pink-300/50 dark:border-pink-700/60 shadow-pink-500/10",
      textClass: "text-pink-600 dark:text-pink-400",
      hoverText: "group-hover:text-pink-600 dark:group-hover:text-pink-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
  ];

  const copyReferral = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const shareTechnicianInvite = () => {
    const text = encodeURIComponent(
      `Join the Just24You certified doorstep appliance technician network! Register with my sponsor referral code: ${referralCode} and get instant welcome wallet coins!`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6">
      {/* Modern Minimalist Hero Header Container */}
      <div className="rounded-3xl bg-gradient-to-br from-[#1976D2] via-[#1565C0] to-[#0A387E] text-white shadow-xl overflow-hidden relative border border-blue-400/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-72 h-72 bg-blue-400/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top Navbar Row */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/15 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="font-display font-black text-xl tracking-tight text-white drop-shadow-sm">Just24You Pro</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell with Badge */}
            <Link
              to="/vendor/notifications"
              className="relative p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all active:scale-95"
              title="Notifications"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-[1.125rem] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-md animate-pulse">
                  {unreadNotifications}
                </span>
              )}
            </Link>

            {/* Wallet Quick Button */}
            <Link
              to="/vendor/wallet"
              className="flex items-center gap-1.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 px-4 py-2 text-xs font-black text-white transition-all shadow-sm active:scale-95 backdrop-blur-md"
              title="Technician Wallet Balance"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="6" width="18" height="13" rx="2" strokeWidth="2"/>
                <circle cx="16" cy="12.5" r="1.5" fill="currentColor"/>
              </svg>
              <span className="font-mono tracking-tight">{loading ? "..." : `₹${walletCoins}`}</span>
            </Link>
          </div>
        </div>

        {/* Welcome Banner with Technician Tier Badge */}
        <div className="px-6 py-8 sm:py-10 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-xs font-black mb-3.5 shadow-sm backdrop-blur-md">
            <span>{techTier.icon}</span>
            <span className="text-white tracking-wide">{techTier.rank}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
            Welcome {vendorDisplayName}
          </h2>
          <p className="mt-1 text-xs sm:text-sm font-mono font-bold text-blue-200">
            {vendorCodeDisplay}
          </p>
          <p className="mt-2 text-xs sm:text-sm text-blue-100/90 font-medium max-w-lg mx-auto leading-relaxed">
            Good to see you again, stay tuned for latest dispatches &amp; network commissions.
          </p>
        </div>
      </div>

      {/* Technician Milestone & MLM Network Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Completed Jobs Milestone Meter */}
        <div className="rounded-3xl bg-white dark:bg-[#0f172a] p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>🎯</span> Completed Jobs Meter
              </span>
              <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-[10px] px-2.5 py-0.5 border border-emerald-500/30">
                98.4% On-Time
              </span>
            </div>
            <div className="mt-3.5 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{completedLeadsCount}</span>
              <span className="text-xs font-semibold text-slate-500">jobs successfully serviced</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Next Rank Target: <span className="font-black text-blue-600 dark:text-blue-400">{techTier.nextTarget} jobs</span> ({techTier.nextTarget - completedLeadsCount > 0 ? `${techTier.nextTarget - completedLeadsCount} remaining` : "Target Met!"})
            </p>
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mt-3.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${Math.min(100, (completedLeadsCount / techTier.nextTarget) * 100)}%` }}
              />
            </div>
          </div>
          <Link
            to="/vendor/leads?status=COMPLETED"
            className="mt-4 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between"
          >
            <span>View Completed Job History</span>
            <span>→</span>
          </Link>
        </div>

        {/* Unified MLM Commission Engine Snapshot */}
        <div className="rounded-3xl bg-gradient-to-br from-[#0b1329] via-[#111c38] to-[#1e293b] text-white p-5 border border-slate-700/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span>🌐</span> MLM Downline &amp; Commissions
              </span>
              <span className="rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px] px-2.5 py-0.5 border border-amber-500/40">
                {downlineCount} Active Partners
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mt-3.5 text-center">
              <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Direct Sponsor (L1)</p>
                <p className="text-xl font-black text-amber-400 mt-1 font-mono">🪙 {l1Commissions}</p>
              </div>
              <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Team Override (L2)</p>
                <p className="text-xl font-black text-emerald-400 mt-1 font-mono">🪙 {l2Commissions}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-slate-300 truncate">Code: <strong className="text-white">{referralCode}</strong></span>
            <button
              onClick={shareTechnicianInvite}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-[11px] font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>💬</span> Invite Techs
            </button>
          </div>
        </div>
      </div>

      {/* Modern Minimalist Circular Action Icons Grid */}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-3 gap-y-8 gap-x-4 sm:grid-cols-4 sm:gap-x-6 text-center">
          {quickActions.map((action) => (
            <Link
              key={action.id}
              to={action.path}
              className="group flex flex-col items-center justify-start focus:outline-none"
            >
              <div className={`relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full border shadow-md group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 ${action.bgClass}`}>
                <div className={`transform group-hover:scale-110 transition-transform duration-200 ${action.textClass}`}>
                  {action.icon}
                </div>
              </div>
              <span className={`mt-2.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 transition-colors ${action.hoverText}`}>
                {action.title}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Live Doorstep Navigation Section (Rendered if there is an active job) */}
      {activeJob && (
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-display text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🗺️</span> Current Doorstep Service Navigation
            </h3>
            <button
              onClick={() => setShowNavModal(true)}
              className="rounded-xl bg-[#1976D2] hover:bg-[#1565C0] text-white px-3.5 py-1.5 text-xs font-bold shadow-md transition-colors"
            >
              Expand Map
            </button>
          </div>
          <GoogleMapsTracker
            isModal={false}
            serviceId={`LEAD-${activeJob.id.slice(0, 8)}`}
            serviceTitle={activeJob.serviceType || "Doorstep Appliance Service"}
            customerAddress={activeJob.address || activeJob.area || "Customer Location"}
            vendorName={vendorDisplayName}
            vendorPhone={user?.phone || ""}
          />
        </div>
      )}

      {/* GPS Route Modal */}
      {showNavModal && activeJob && (
        <GoogleMapsTracker
          isModal
          isOpen={showNavModal}
          onClose={() => setShowNavModal(false)}
          serviceId={`LEAD-${activeJob.id.slice(0, 8)}`}
          serviceTitle={activeJob.serviceType || "Doorstep Appliance Service Route"}
          customerAddress={activeJob.address || activeJob.area || "Customer Location"}
          vendorName={vendorDisplayName}
          vendorPhone={user?.phone || ""}
        />
      )}

      {/* Recent Leads Preview List from Database */}
      <div className="rounded-3xl bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
          <p className="font-display text-base sm:text-lg font-black text-[#0f172a] dark:text-white">
            Live Assigned Leads Pipeline
          </p>
          <Link
            to="/vendor/leads"
            className="text-xs font-bold text-[#1976D2] hover:underline"
          >
            Manage All Leads ({leads.length}) →
          </Link>
        </div>

        {loading ? (
          <div className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        ) : leads.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p className="text-2xl mb-1">📋</p>
            <p className="font-bold text-xs text-gray-700 dark:text-gray-300">No active leads currently assigned.</p>
            <p className="text-[11px] mt-0.5 text-gray-500 dark:text-gray-400">New leads dispatched by branch admin will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {leads.slice(0, 4).map((lead) => {
              const isNew = lead.status === "NEW";
              const leadCost = lead.leadAcceptanceCharge !== undefined ? lead.leadAcceptanceCharge : 50;

              return (
                <div
                  key={lead.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 dark:bg-gray-800/80 p-4 border border-slate-200 dark:border-gray-700 hover:border-[#1976D2] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-base text-[#0f172a] dark:text-white">
                        {lead.customerName}
                      </p>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-200">
                        {lead.status.replace(/_/g, " ")}
                      </span>
                      {isNew && (
                        <span className="text-[10px] font-bold text-amber-900 dark:text-amber-200 bg-amber-400/25 px-2 py-0.5 rounded border border-amber-500/30">
                          🔒 Masked
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[#334155] dark:text-slate-300 mt-1">
                      🔧 {lead.serviceType ?? "Service"} • 📍 {lead.address || lead.area || "Location"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#c2410c] dark:text-orange-400">
                      🪙 {leadCost} Coins
                    </span>
                    <Link
                      to={isNew ? `/vendor/leads?status=NEW` : `/vendor/leads/${lead.id}`}
                      className="rounded-xl bg-[#1976D2] hover:bg-[#1565C0] text-white px-3 py-1.5 text-xs font-bold shadow-sm transition-colors"
                    >
                      {isNew ? "Accept Lead" : "Open Job →"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
