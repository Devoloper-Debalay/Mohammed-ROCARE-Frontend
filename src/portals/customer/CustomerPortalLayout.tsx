import { Outlet, useNavigate } from "react-router-dom";
import { PortalShell } from "@/components/layout/PortalShell";
import { useCustomerAuth } from "@/store/authStore";

const navItems = [
  { to: "/customer/dashboard", label: "Overview", icon: <span className="h-4 w-4 rounded bg-current opacity-40" /> },
  { to: "/customer/catalog", label: "Catalog", icon: <span className="h-4 w-4 rounded-full bg-current opacity-40" /> },
  { to: "/customer/cart", label: "Cart", icon: <span className="h-4 w-4 rounded bg-current opacity-30" /> },
  { to: "/customer/orders", label: "Orders", icon: <span className="h-4 w-4 rounded bg-current opacity-40" /> },
  { to: "/customer/service-requests", label: "Service requests", icon: <span className="h-4 w-4 rounded-full border-2 border-current" /> },
  { to: "/customer/complaints", label: "Complaints", icon: <span className="h-4 w-4 rotate-45 bg-current opacity-30" /> },
  { to: "/customer/addresses", label: "Addresses", icon: <span className="h-4 w-4 rounded-full bg-current opacity-30" /> },
  { to: "/customer/notifications", label: "Notifications", icon: <span className="h-4 w-4 rounded bg-current opacity-30" /> },
];

export function CustomerPortalLayout() {
  const navigate = useNavigate();
  const { user, logout } = useCustomerAuth();

  return (
    <PortalShell
      navItems={navItems}
      accent="teal"
      portalLabel="Customer portal"
      userLabel={user ? `${user.firstName} ${user.lastName}` : "Customer"}
      userMeta={user?.phone ?? user?.email}
      onLogout={() => {
        logout();
        navigate("/customer/login");
      }}
    >
      <Outlet />
    </PortalShell>
  );
}
