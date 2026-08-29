import React, { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useStaffAuth } from "@/store/authStore";
import { useTheme } from "@/context/ThemeContext";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  badge?: { text: string; tone: "primary" | "warning" | "success" | "danger" | "info" };
  isSuperAdminOnly?: boolean;
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
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  const displayName = user?.fullName || (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.email) || "Branch Administrator";
  const avatarChar = displayName.charAt(0).toUpperCase() || "A";

  const filterItem = (item: NavItem) =>
    item.label.toLowerCase().includes(navSearch.toLowerCase());

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
                  ROCARE<span className="text-[#0dcaf0]">LTE</span>
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
                          ? "bg-amber-500/20 text-amber-300"
                          : item.badge.tone === "info"
                          ? "bg-cyan-500/20 text-cyan-300"
                          : "bg-blue-500/20 text-blue-300"
                      }`}
                    >
                      {item.badge.text}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Super Admin Section */}
          {isSuperAdmin && (
            <>
              <div className="mb-2 mt-5 px-3 pt-2 border-t border-gray-700/50">
                {sidebarOpen && (
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-1">
                    <span>👑</span> SUPER ADMIN CONTROLS
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
                            ? "bg-[#d97706] text-white shadow-md"
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
            title="Sign out from ROCARE Admin"
          >
            <span>🚪</span>
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* =========================================================================
          AdminLTE 4 Main Content Area
          ========================================================================= */}
      <div className={`flex min-h-screen flex-1 flex-col transition-all duration-300 ${sidebarOpen ? "lg:pl-64" : "lg:pl-20"}`}>
        
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

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-base transition-colors"
                title="System Notifications"
              >
                <span>🔔</span>
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-extrabold text-white">
                  3
                </span>
              </button>

              {showNotificationDropdown && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 p-3 z-50 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2 px-1">
                    <span className="font-bold text-xs text-gray-900 dark:text-white">Admin Activity Alerts (3)</span>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 cursor-pointer">Mark read</span>
                  </div>
                  <div className="space-y-2 mt-2">
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-xs">
                      <p className="font-bold text-amber-900 dark:text-amber-300">👨‍🔧 2 New Technicians KYC Pending</p>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">Tanmoy Mukherjee & Bikash Sarkar uploaded Aadhaar</p>
                    </div>
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-xs">
                      <p className="font-bold text-blue-900 dark:text-blue-300">📍 Geotag Start Proof Submitted</p>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">Job #LEAD-KOL-101 started at Salt Lake Sector 1</p>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-xs">
                      <p className="font-bold text-emerald-900 dark:text-emerald-300">💳 ₹1,499 UPI Payment Received</p>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">Order #ORD-9021 confirmed via Razorpay</p>
                    </div>
                  </div>
                </div>
              )}
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
                ROCARE LTE
              </Link>
              <span>/</span>
              <span className="font-bold text-gray-900 dark:text-white capitalize">
                {location.pathname.replace("/staff/", "").replace("/", " → ") || "Dashboard"}
              </span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ROCARE Backend API Connected • Port 5000</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-8">
          <Outlet />
        </main>

        {/* AdminLTE 4 Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 sm:px-8 py-4 text-xs text-gray-600 dark:text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-gray-900 dark:text-white">Copyright &copy; 2026 ROCARE Platform.</strong> All rights reserved.
          </div>
          <div className="flex items-center gap-3">
            <span>Powered by <span className="font-bold text-blue-600">AdminLTE 4.9.1</span></span>
            <span className="text-gray-300 dark:text-gray-700">•</span>
            <span className="font-mono text-[11px]">v1.0.0-PROD</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
