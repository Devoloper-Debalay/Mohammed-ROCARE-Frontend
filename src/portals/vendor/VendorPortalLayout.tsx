import { Outlet, useNavigate } from "react-router-dom";
import { PortalShell } from "@/components/layout/PortalShell";
import { FloatingChatbot } from "@/components/chatbot/FloatingChatbot";
import { useVendorAuth } from "@/store/authStore";

const navItems = [
  { to: "/vendor/dashboard", label: "Overview", icon: <span className="h-4 w-4 rounded bg-current opacity-40" /> },
  { to: "/vendor/leads", label: "Leads", icon: <span className="h-4 w-4 rounded-full border-2 border-current" /> },
  { to: "/vendor/wallet", label: "Wallet", icon: <span className="h-4 w-4 rounded bg-current opacity-40" /> },
  { to: "/vendor/products", label: "Products & parts", icon: <span className="h-4 w-4 rounded bg-current opacity-30" /> },
  { to: "/vendor/offers", label: "Offers", icon: <span className="h-4 w-4 rotate-45 bg-current opacity-30" /> },
  { to: "/vendor/complaints", label: "Complaints", icon: <span className="h-4 w-4 rounded-full bg-current opacity-30" /> },
  { to: "/vendor/profile", label: "Profile & KYC", icon: <span className="h-4 w-4 rounded-full bg-current opacity-40" /> },
  { to: "/vendor/notifications", label: "Notifications", icon: <span className="h-4 w-4 rounded bg-current opacity-30" /> },
];

export function VendorPortalLayout() {
  const navigate = useNavigate();
  const { user, logout } = useVendorAuth();

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
      <Outlet />
      <FloatingChatbot botName="ROCARE Assistant" botSubtitle="Vendor Helpdesk AI" />
    </PortalShell>
  );
}

