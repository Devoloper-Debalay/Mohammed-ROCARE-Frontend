import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { PortalShell } from "@/components/layout/PortalShell";
import { useCustomerAuth } from "@/store/authStore";
import { customerApi, portalStorage, unwrapList } from "@/lib/apiClient";

const navItems = [
  { to: "/customer/dashboard", label: "Overview", icon: <span className="h-4 w-4 rounded bg-current opacity-40" /> },
  { to: "/customer/profile", label: "My Profile & Badges", icon: <span className="h-4 w-4 rounded-full bg-current opacity-40" /> },
  { to: "/customer/catalog", label: "Appliance Store", icon: <span className="h-4 w-4 rounded-full bg-current opacity-40" /> },
  { to: "/customer/cart", label: "Shopping Cart", icon: <span className="h-4 w-4 rounded bg-current opacity-30" /> },
  { to: "/customer/orders", label: "Orders & Tracking", icon: <span className="h-4 w-4 rounded bg-current opacity-40" /> },
  { to: "/customer/offers", label: "Offers & Coupons", icon: <span className="h-4 w-4 rounded-md border-2 border-current" /> },
  { to: "/customer/service-requests", label: "Service Requests", icon: <span className="h-4 w-4 rounded-full border-2 border-current" /> },
  { to: "/customer/complaints", label: "Complaints Desk", icon: <span className="h-4 w-4 rotate-45 bg-current opacity-30" /> },
  { to: "/customer/addresses", label: "Delivery Addresses", icon: <span className="h-4 w-4 rounded-full bg-current opacity-30" /> },
  { to: "/customer/notifications", label: "Notifications", icon: <span className="h-4 w-4 rounded bg-current opacity-30" /> },
];

export function CustomerPortalLayout() {
  const navigate = useNavigate();
  const { user, setSession, logout } = useCustomerAuth();
  const [completedCount, setCompletedCount] = useState<number>(0);

  useEffect(() => {
    // 1. Fetch Customer Profile to ensure real name and phone are synced in state
    customerApi
      .get("/customer/profile")
      .then((res) => {
        const profile = res.data?.data ?? res.data;
        if (profile) {
          const currentToken = portalStorage.getToken("customer");
          setSession({
            token: currentToken || undefined,
            user: {
              ...(user || {}),
              id: profile.id || user?.id,
              firstName: profile.firstName || user?.firstName || "",
              lastName: profile.lastName || user?.lastName || "",
              name: profile.name || profile.fullName || user?.name || "",
              email: profile.email || user?.email,
              phone: profile.phone || user?.phone,
              referralCode: profile.referralCode || (user as any)?.referralCode,
            },
          });
        }
      })
      .catch(() => {});

    // 2. Fetch completed services and revenue across all backend routes
    Promise.allSettled([
      customerApi.get("/customer/service-request"),
      customerApi.get("/customer/service-requests"),
      customerApi.get("/orders/customer"),
      customerApi.get("/customer/orders"),
      customerApi.get("/customer/dashboard"),
      customerApi.get("/customer/profile"),
    ]).then((results) => {
      let maxCompleted = 0;
      let totalRev = 0;

      for (const r of results) {
        if (r.status === "fulfilled" && r.value?.data) {
          const payload = r.value.data?.data ?? r.value.data;
          if (payload && typeof payload === "object") {
            if (payload.completedServicesCount !== undefined) {
              maxCompleted = Math.max(maxCompleted, Number(payload.completedServicesCount));
            }
            if (payload.completedVisits !== undefined) {
              maxCompleted = Math.max(maxCompleted, Number(payload.completedVisits));
            }
            if (payload.lifetimeRevenue !== undefined || payload.lifetimeSpend !== undefined || payload.totalSpend !== undefined || payload.totalRevenue !== undefined) {
              const rev = Number(payload.lifetimeRevenue || payload.lifetimeSpend || payload.totalSpend || payload.totalRevenue || 0);
              totalRev = Math.max(totalRev, rev);
            }
          }
          const list = unwrapList<any>(payload);
          if (list.length > 0) {
            const completedInList = list.filter(
              (item: any) =>
                item.status === "COMPLETED" ||
                item.status === "DELIVERED" ||
                item.status === "CONFIRMED" ||
                item.status === "RESOLVED" ||
                item.stage === 3 ||
                item.isCompleted === true
            ).length;
            maxCompleted = Math.max(maxCompleted, completedInList > 0 ? completedInList : list.length);

            let listSum = 0;
            for (const item of list) {
              const val = Number(item.totalAmount || item.amount || item.price || item.total || 0);
              if (!isNaN(val) && val > 0) listSum += val;
            }
            totalRev = Math.max(totalRev, listSum);
          }
        }
      }
      setCompletedCount(maxCompleted);
      setLifetimeRev(totalRev);
    });
  }, []);

  const [lifetimeRev, setLifetimeRev] = useState<number>(0);

  const getTierBadge = (rev: number) => {
    if (rev >= 50000) return { label: "💎 Platinum VIP", style: "bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/30" };
    if (rev >= 15000) return { label: "🥇 Gold VIP", style: "bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30" };
    if (rev >= 5000) return { label: "🥈 Silver Member", style: "bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30" };
    return { label: "🥉 Bronze VIP", style: "bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/30" };
  };

  const tierBadge = getTierBadge(lifetimeRev);

  // Compute real Customer Full Name
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.name ||
    (user as any)?.fullName ||
    (user?.phone ? `Customer (${user.phone})` : "") ||
    user?.email ||
    "Mithu Das";

  return (
    <PortalShell
      navItems={navItems}
      accent="teal"
      portalLabel="ROCARE Customer Portal"
      userLabel={fullName}
      userMeta={user?.phone || user?.email || "+91 90516 07464"}
      userBadge={
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase border whitespace-nowrap ${tierBadge.style}`}>
          {tierBadge.label}
        </span>
      }
      onLogout={() => {
        logout();
        navigate("/customer/login");
      }}
    >
      <Outlet />
    </PortalShell>
  );
}
