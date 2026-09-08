import React, { useState, useEffect, useCallback } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useStaffAuth } from "@/store/authStore";
import { useTheme } from "@/context/ThemeContext";
import { adminApi, unwrapList } from "@/lib/apiClient";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  badge?: { text: string; tone: "primary" | "warning" | "success" | "danger" | "info" };
  isSuperAdminOnly?: boolean;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type?: string;
  isRead?: boolean;
  link?: string;
  createdAt?: string;
}

const MAIN_NAV_ITEMS: NavItem[] = [
  { to: "/staff/dashboard", label: "Dashboard Overview", icon: "📊" },
  { to: "/staff/vendors", label: "Technicians & KYC", icon: "👨‍🔧", badge: { text: "KYC", tone: "warning" } },
  { to: "/staff/leads", label: "Leads & Geotag Proofs", icon: "🎯", badge: { text: "Proofs", tone: "primary" } },
  { to: "/staff/orders", label: "Orders & Fleet Radar", icon: "📦" },
  { to: "/staff/payments", label: "Payment Verification", icon: "💳", badge: { text: "Review", tone: "info" } },
  { to: "/staff/catalog", label: "Catalog & AMC Services", icon: "🏷️" },
  { to: "/staff/wallet", label: "Wallet Coin Management", icon: "💰" },
  { to: "/staff/complaints", label: "Complaints & Tickets", icon: "🛡️" },
];

const SUPER_ADMIN_NAV_ITEMS: NavItem[] = [
  { to: "/staff/super-admin", label: "Executive Analytics", icon: "📈", isSuperAdminOnly: true },
  { to: "/staff/super-admin/branches", label: "Branch Offices Network", icon: "🏢", isSuperAdminOnly: true },
  { to: "/staff/super-admin/admins", label: "Admin Staff Accounts", icon: "👥", isSuperAdminOnly: true },
  { to: "/staff/super-admin/users", label: "Customer User Directory", icon: "👤", isSuperAdminOnly: true },
  { to: "/staff/super-admin/settings", label: "Platform Settings & Rates", icon: "⚙️", isSuperAdminOnly: true },
  { to: "/staff/super-admin/audit-logs", label: "Security & Audit Trail", icon: "📜", isSuperAdminOnly: true },
  { to: "/staff/super-admin/reports", label: "Financial Reports & Exports", icon: "📑", isSuperAdminOnly: true },
];

export function StaffPortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useStaffAuth();
  const { theme, toggleTheme } = useTheme();
  const isSuperAdmin = user?.role === "SADMIN";

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Live Notifications State
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const displayName = user?.fullName || (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.email) || "Branch Administrator";
  const avatarChar = displayName.charAt(0).toUpperCase() || "A";

  const filterItem = (item: NavItem) =>
    item.label.toLowerCase().includes(navSearch.toLowerCase());

  // Helper for persistent read notification tracking
  const getReadNotificationIds = (): Set<string> => {
    try {
      const stored = localStorage.getItem("just24you_admin_read_notifs");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  };

  const saveReadNotificationId = (id: string) => {
    try {
      const set = getReadNotificationIds();
      set.add(id);
      localStorage.setItem("just24you_admin_read_notifs", JSON.stringify(Array.from(set)));
    } catch {}
  };

  const saveAllReadNotificationIds = (ids: string[]) => {
    try {
      const set = getReadNotificationIds();
      ids.forEach((id) => set.add(id));
      localStorage.setItem("just24you_admin_read_notifs", JSON.stringify(Array.from(set)));
    } catch {}
  };

  // Fetch real-time notifications from Just24You_backend
  const fetchAdminNotifications = useCallback(async () => {
    try {
      let fetchedList: AdminNotification[] = [];

      // 1. Query dedicated notifications endpoint
      try {
        const res = await adminApi.get("/admin/notifications");
        fetchedList = unwrapList<AdminNotification>(res.data?.data ?? res.data);
      } catch {
        try {
          const res = await adminApi.get("/notifications");
          fetchedList = unwrapList<AdminNotification>(res.data?.data ?? res.data);
        } catch {}
      }

      // 2. Multi-stream fallback: If dedicated notification list is empty, aggregate live event signals
      if (fetchedList.length === 0) {
        const [vRes, spRes, dpRes, payRes, compRes] = await Promise.allSettled([
          adminApi.get("/admin/vendors?limit=50"),
          adminApi.get("/admin/leads/start-proofs"),
          adminApi.get("/admin/leads/denial-proofs"),
          adminApi.get("/admin/payments?limit=20"),
          adminApi.get("/admin/complaints?limit=20"),
        ]);

        const derived: AdminNotification[] = [];

        // Pending KYC Approvals
        if (vRes.status === "fulfilled") {
          const vList = unwrapList<any>(vRes.value.data?.data ?? vRes.value.data);
          const pendingKyc = vList.filter((v) => !v.isVerified && v.status !== "REJECTED");
          if (pendingKyc.length > 0) {
            derived.push({
              id: "notif-kyc",
              title: `👨‍🔧 ${pendingKyc.length} Technician KYC Verification Pending`,
              message: `${pendingKyc.slice(0, 2).map((k) => k.fullName).join(", ")}${pendingKyc.length > 2 ? ` and ${pendingKyc.length - 2} more` : ""} uploaded Aadhaar / PAN documents.`,
              type: "KYC",
              isRead: false,
              link: "/staff/vendors",
              createdAt: new Date().toISOString(),
            });
          }
        }

        // Pending Start Proofs
        if (spRes.status === "fulfilled") {
          const spList = unwrapList<any>(spRes.value.data?.data ?? spRes.value.data);
          if (spList.length > 0) {
            derived.push({
              id: "notif-sp",
              title: `📸 ${spList.length} On-Site Start Proofs Awaiting Audit`,
              message: `Technicians have arrived at doorstep customer locations with geotag photos.`,
              type: "START_PROOF",
              isRead: false,
              link: "/staff/leads",
              createdAt: new Date().toISOString(),
            });
          }
        }

        // Pending Denial Proofs
        if (dpRes.status === "fulfilled") {
          const dpList = unwrapList<any>(dpRes.value.data?.data ?? dpRes.value.data);
          if (dpList.length > 0) {
            derived.push({
              id: "notif-dp",
              title: `🚫 ${dpList.length} Denial Refund Reviews in Queue`,
              message: `Technicians reported customer unavailable at premises. Coin refund review needed.`,
              type: "DENIAL_PROOF",
              isRead: false,
              link: "/staff/leads",
              createdAt: new Date().toISOString(),
            });
          }
        }

        // Pending Payments
        if (payRes.status === "fulfilled") {
          const payList = unwrapList<any>(payRes.value.data?.data ?? payRes.value.data);
          const pendingPay = payList.filter((p) => p.status === "PENDING");
          if (pendingPay.length > 0) {
            derived.push({
              id: "notif-pay",
              title: `💳 ${pendingPay.length} UPI / QR Payments Pending Verification`,
              message: `Digital bank settlements awaiting administrative reconciliation.`,
              type: "PAYMENT",
              isRead: false,
              link: "/staff/payments",
              createdAt: new Date().toISOString(),
            });
          }
        }

        // Open Complaints
        if (compRes.status === "fulfilled") {
          const compList = unwrapList<any>(compRes.value.data?.data ?? compRes.value.data);
          const openComp = compList.filter((c) => c.status === "OPEN" || c.status === "PENDING");
          if (openComp.length > 0) {
            derived.push({
              id: "notif-comp",
              title: `🛡️ ${openComp.length} Open Customer Support Tickets`,
              message: `Customer complaints requiring immediate resolution.`,
              type: "COMPLAINT",
              isRead: false,
              link: "/staff/complaints",
              createdAt: new Date().toISOString(),
            });
          }
        }

        fetchedList = derived;
      }

      // Check persistent read IDs
      const readIds = getReadNotificationIds();
      const updatedList = fetchedList.map((item) => ({
        ...item,
        isRead: item.isRead || readIds.has(item.id),
      }));

      setNotifications(updatedList);
      setUnreadCount(updatedList.filter((n) => !n.isRead).length);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    fetchAdminNotifications();
    const interval = setInterval(() => {
      fetchAdminNotifications();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchAdminNotifications]);

  const handleMarkAllRead = async () => {
    try {
      try {
        await adminApi.patch("/admin/notifications/read-all");
      } catch {
        try {
          await adminApi.post("/notifications/read-all");
        } catch {}
      }
    } catch {}

    saveAllReadNotificationIds(notifications.map((n) => n.id));
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = (item: AdminNotification) => {
    saveReadNotificationId(item.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setShowNotificationModal(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f4f6f9] dark:bg-[#111827] text-gray-900 dark:text-gray-100 font-body transition-colors">
      
      {/* =========================================================================
          AdminLTE 4 Left Sidebar
          ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-[#1f2937] dark:bg-[#0f172a] text-white transition-all duration-300 shadow-xl border-r border-gray-700/50 ${
          sidebarOpen ? "w-64" : "w-20"
        } ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-700/60 px-4">
          <Link to={isSuperAdmin ? "/staff/super-admin" : "/staff/dashboard"} className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0d6efd] to-[#0dcaf0] text-white font-extrabold text-lg shadow-md">
              R
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="font-display text-base font-extrabold tracking-wider text-white">
                  Just24You<span className="text-[#0dcaf0]">LTE</span>
                </span>
                <span className="text-[10px] font-bold text-gray-400">Admin Operations v4.9</span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white text-lg p-1"
          >
            ✕
          </button>
        </div>

        {/* User Mini Profile Panel */}
        <div className="border-b border-gray-700/60 p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#198754] to-[#20c997] text-white font-bold shadow-md">
                {avatarChar}
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-[#1f2937]" />
            </div>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">{displayName}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider ${
                      isSuperAdmin ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    }`}
                  >
                    {isSuperAdmin ? "Super Admin" : "Branch Admin"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Search */}
        {sidebarOpen && (
          <div className="px-3 pt-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search menu..."
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                className="w-full rounded-lg bg-gray-800/80 py-1.5 pl-8 pr-3 text-xs text-gray-200 placeholder-gray-400 border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Navigation Treeview Menu */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin">
          {/* Main Navigation Section */}
          <div className="mb-2 px-3 pt-2">
            {sidebarOpen && (
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                MAIN NAVIGATION
              </span>
            )}
          </div>
          <ul className="space-y-1">
            {MAIN_NAV_ITEMS.filter(filterItem).map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                      isActive
                        ? "bg-[#0d6efd] text-white shadow-md"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    } ${!sidebarOpen ? "justify-center" : ""}`
                  }
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  {sidebarOpen && <span className="flex-1 truncate">{item.label}</span>}
                  {sidebarOpen && item.badge && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                        item.badge.tone === "warning"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : item.badge.tone === "primary"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                          : item.badge.tone === "success"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      }`}
                    >
                      {item.badge.text}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Super-Admin Section */}
          {isSuperAdmin && (
            <>
              <div className="mb-2 mt-6 px-3 pt-2 border-t border-gray-700/60">
                {sidebarOpen && (
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                    <span>👑</span> SUPER-ADMIN CONTROLS
                  </span>
                )}
              </div>
              <ul className="space-y-1">
                {SUPER_ADMIN_NAV_ITEMS.filter(filterItem).map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                          isActive
                            ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        } ${!sidebarOpen ? "justify-center" : ""}`
                      }
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <span className="text-base shrink-0">{item.icon}</span>
                      {sidebarOpen && <span className="flex-1 truncate">{item.label}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>

        {/* Sidebar Footer / Logout */}
        <div className="border-t border-gray-700/60 p-3 bg-gray-900/40">
          <button
            onClick={() => {
              logout();
              navigate("/staff/login");
            }}
            className={`flex w-full items-center gap-2.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 px-3 py-2 text-xs font-bold transition-colors border border-red-500/20 ${
              !sidebarOpen ? "justify-center" : ""
            }`}
            title="Sign out from Just24You Admin"
          >
            <span>🚪</span>
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* =========================================================================
          AdminLTE 4 Main Content Area
          ========================================================================= */}
      <div className={`flex min-h-screen flex-1 flex-col min-w-0 max-w-full overflow-x-hidden transition-all duration-300 ${sidebarOpen ? "lg:pl-64" : "lg:pl-20"}`}>
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 sm:px-6 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Sidebar Collapse Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-lg transition-colors"
              title="Toggle sidebar"
            >
              ☰
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-lg transition-colors"
            >
              ☰
            </button>

            {/* Branch Hub Badge */}
            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800 px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-xs">
              <span className="text-blue-600 dark:text-blue-400 font-bold">🏢 Active Hub:</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">Kolkata Central (Dunlop / Salt Lake)</span>
            </div>
          </div>

          {/* Right Header Navigation Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Dark / Light Mode Switch */}
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-base transition-colors"
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {/* Notifications Bell Icon Button */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationModal(true)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-base transition-colors"
                title="View Admin Notifications"
              >
                <span>🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white animate-pulse shadow-sm">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* User Profile Quick Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0d6efd] text-white text-xs font-bold">
                  {avatarChar}
                </div>
                <span className="hidden md:inline text-xs font-bold text-gray-900 dark:text-white max-w-[120px] truncate">
                  {displayName}
                </span>
                <span className="text-[10px] text-gray-400">▼</span>
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 p-3 z-50 animate-fadeIn">
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-2.5 px-1">
                    <p className="font-bold text-xs text-gray-900 dark:text-white">{displayName}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 rounded bg-blue-100 dark:bg-blue-950 px-2 py-0.5 text-[9px] font-bold text-blue-700 dark:text-blue-300">
                      Role: {user?.role || "ADMIN"}
                    </span>
                  </div>
                  <div className="pt-2 space-y-1">
                    {isSuperAdmin && (
                      <Link
                        to="/staff/super-admin/settings"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <span>⚙️</span> Platform Settings
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        logout();
                        navigate("/staff/login");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <span>🚪</span> Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Header & Breadcrumbs */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 px-4 sm:px-8 py-3.5 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Link to="/staff/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 font-bold">
                Just24You LTE
              </Link>
              <span>/</span>
              <span className="font-bold text-gray-900 dark:text-white capitalize">
                {location.pathname.replace("/staff/", "").replace("/", " → ") || "Dashboard"}
              </span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Just24You Backend API Connected • Port 5000</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-8 min-w-0 max-w-full overflow-x-hidden">
          <Outlet />
        </main>

        {/* AdminLTE 4 Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 sm:px-8 py-4 text-xs text-gray-600 dark:text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-gray-900 dark:text-white">Copyright &copy; 2026 Just24You Platform.</strong> All rights reserved.
          </div>
          <div className="flex items-center gap-3">
            <span>Powered by <span className="font-bold text-blue-600">AdminLTE 4.9.1</span></span>
            <span className="text-gray-300 dark:text-gray-700">•</span>
            <span className="font-mono text-[11px]">v1.0.0-PROD</span>
          </div>
        </footer>
      </div>

      {/* =========================================================================
          Floating Pop-up Notification Modal Window
          ========================================================================= */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div
            className="relative w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden mt-12 mr-2 sm:mr-4 transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🔔</span>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight">System &amp; Operations Alerts</h3>
                  <p className="text-[10px] text-blue-100 font-medium">
                    {unreadCount > 0 ? `${unreadCount} unread realtime alerts` : "All notifications reviewed"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="rounded-lg bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 text-[10px] font-bold transition-colors"
                  >
                    Mark All Read
                  </button>
                )}
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="rounded-full bg-white/20 hover:bg-white/30 text-white h-7 w-7 flex items-center justify-center font-bold text-xs transition-colors"
                  title="Close window"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[65vh] overflow-y-auto p-4 space-y-3 divide-y divide-gray-100 dark:divide-gray-800/60 scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <p className="text-3xl mb-2">🎉</p>
                  <p className="font-bold text-xs text-gray-800 dark:text-gray-200">No New Operational Alerts</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Your dispatch hub is running smoothly with 0 pending items.
                  </p>
                </div>
              ) : (
                notifications.map((item) => {
                  const isKyc = item.type === "KYC";
                  const isStartProof = item.type === "START_PROOF";
                  const isDenial = item.type === "DENIAL_PROOF";
                  const isPayment = item.type === "PAYMENT";
                  const isComplaint = item.type === "COMPLAINT";

                  const cardStyle = isKyc
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-200"
                    : isStartProof
                    ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-blue-950 dark:text-blue-200"
                    : isDenial
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-950 dark:text-rose-200"
                    : isPayment
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200"
                    : isComplaint
                    ? "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60 text-purple-950 dark:text-purple-200"
                    : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100";

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`pt-3 first:pt-0 cursor-pointer group`}
                    >
                      <div className={`p-3.5 rounded-2xl border transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${cardStyle} ${!item.isRead ? "ring-2 ring-blue-500/40" : "opacity-80"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {!item.isRead && (
                              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                            )}
                            <p className="font-extrabold text-xs tracking-tight">{item.title}</p>
                          </div>
                          {item.createdAt && (
                            <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                              {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 leading-snug">
                          {item.message}
                        </p>
                        {item.link && (
                          <div className="mt-2 text-right">
                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 group-hover:underline">
                              Review in Dashboard →
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 flex items-center justify-between text-[11px]">
              <span className="text-gray-500 font-semibold">Live Realtime Feed</span>
              <button
                onClick={fetchAdminNotifications}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>🔄</span> Refresh Feed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
