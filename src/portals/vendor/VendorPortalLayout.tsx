import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { PortalShell } from "@/components/layout/PortalShell";
import { FloatingChatbot } from "@/components/chatbot/FloatingChatbot";
import { vendorApi, unwrapList } from "@/lib/apiClient";
import { useVendorAuth, isVendorApproved } from "@/store/authStore";
import { sfx } from "@/lib/soundEffects";

interface VendorNotification {
  id: string;
  title: string;
  message: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
}

const NOTIFICATION_POLL_MS = 20000;

export function VendorPortalLayout() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useVendorAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [leadToast, setLeadToast] = useState<{ title: string; message: string } | null>(null);
  const lastCheckedRef = useRef<string | null>(null);

  // Re-sync verification/profile status on every portal entry so admin approvals
  // (or rejections) that happened elsewhere show up without a fresh login.
  useEffect(() => {
    vendorApi
      .get("/vendor/profile")
      .then((res) => {
        const data = res.data?.data ?? res.data;
        if (data) updateUser(data);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pollNotifications = useCallback(() => {
    if (!user?.id) return;
    const storageKey = `just24you.vendor.notif.lastCheckedAt.${user.id}`;
    if (lastCheckedRef.current === null) {
      lastCheckedRef.current = localStorage.getItem(storageKey) || new Date(0).toISOString();
    }

    vendorApi
      .get("/vendor/notifications?limit=10")
      .then((res) => {
        const items = unwrapList<VendorNotification>(res.data?.data ?? res.data);
        setUnreadCount(items.filter((n) => !n.isRead).length);

        const since = lastCheckedRef.current!;
        const freshLeads = items.filter(
          (n) => n.type === "NEW_LEAD_RELEASED" && !n.isRead && n.createdAt > since
        );

        if (freshLeads.length > 0) {
          const newest = freshLeads[0];
          setLeadToast({
            title: freshLeads.length > 1 ? `🔔 ${freshLeads.length} New Leads Available!` : "🔔 New Lead Available!",
            message: freshLeads.length > 1 ? "Multiple new service leads match your trade — open Leads to view them." : newest.message,
          });
          sfx.playNotify();
        }

        const latest = items[0]?.createdAt;
        if (latest && latest > since) {
          lastCheckedRef.current = latest;
          localStorage.setItem(storageKey, latest);
        }
      })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    pollNotifications();
    const interval = setInterval(pollNotifications, NOTIFICATION_POLL_MS);
    return () => clearInterval(interval);
  }, [pollNotifications]);

  const approved = isVendorApproved(user);
  const isRejected = user?.verificationStatus === "REJECTED";

  const navItems = [
    { to: "/vendor/dashboard", label: "Overview", icon: <span className="h-4 w-4 rounded bg-current opacity-40" /> },
    { to: "/vendor/leads", label: "Leads", icon: <span className="h-4 w-4 rounded-full border-2 border-current" /> },
    { to: "/vendor/wallet", label: "Wallet", icon: <span className="h-4 w-4 rounded bg-current opacity-40" /> },
    { to: "/vendor/products", label: "Products & parts", icon: <span className="h-4 w-4 rounded bg-current opacity-30" /> },
    { to: "/vendor/offers", label: "Offers", icon: <span className="h-4 w-4 rotate-45 bg-current opacity-30" /> },
    { to: "/vendor/complaints", label: "Complaints", icon: <span className="h-4 w-4 rounded-full bg-current opacity-30" /> },
    { to: "/vendor/profile", label: "Profile & KYC", icon: <span className="h-4 w-4 rounded-full bg-current opacity-40" /> },
    { to: "/vendor/notifications", label: "Notifications", icon: <span className="h-4 w-4 rounded bg-current opacity-30" />, badge: unreadCount },
  ];

  return (
    <PortalShell
      navItems={navItems}
      accent="orange"
      portalLabel="Vendor portal"
      userLabel={user?.fullName ?? "Vendor"}
      userMeta={user ? `${user.role} · ${user.vendorCode}` : undefined}
      onLogout={() => {
        logout();
        navigate("/vendor/login");
      }}
    >
      {!approved && (
        <div
          className={`mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 text-sm font-semibold shadow-sm ${
            isRejected
              ? "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
              : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
          }`}
        >
          <span>
            {isRejected ? "⛔" : "⏳"}{" "}
            {isRejected
              ? "Your KYC was rejected. Update your profile documents and resubmit for review."
              : "Your account is pending admin approval. You can browse and complete your profile, but can't accept leads, buy parts, or add wallet funds yet."}
          </span>
          <Link
            to="/vendor/profile"
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-black shadow-sm ${
              isRejected ? "bg-red-600 text-white hover:bg-red-700" : "bg-amber-600 text-white hover:bg-amber-700"
            }`}
          >
            Go to Profile &amp; KYC →
          </Link>
        </div>
      )}
      <Outlet />
      <FloatingChatbot botName="Just24You Assistant" botSubtitle="Vendor Helpdesk AI" />

      {/* New-lead notification toast */}
      {leadToast && (
        <div className="fixed bottom-6 right-6 z-[60] w-full max-w-sm animate-fade-in">
          <button
            type="button"
            onClick={() => {
              setLeadToast(null);
              navigate("/vendor/leads");
            }}
            className="flex w-full items-start gap-3 rounded-2xl border border-orange-300 dark:border-orange-800 bg-white dark:bg-gray-900 p-4 text-left shadow-2xl transition-transform hover:scale-[1.02]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950 text-lg">
              🛠️
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold text-gray-900 dark:text-white">{leadToast.title}</span>
              <span className="mt-0.5 block text-xs text-gray-600 dark:text-gray-300">{leadToast.message}</span>
              <span className="mt-1.5 block text-[11px] font-bold text-orange-600 dark:text-orange-400">
                Tap to open Leads →
              </span>
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                setLeadToast(null);
              }}
              className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              role="button"
              aria-label="Dismiss"
            >
              ✕
            </span>
          </button>
        </div>
      )}
    </PortalShell>
  );
}
