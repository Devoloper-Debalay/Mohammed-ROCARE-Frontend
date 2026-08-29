import { Outlet, useNavigate } from "react-router-dom";
import { PortalShell } from "@/components/layout/PortalShell";
import { useStaffAuth } from "@/store/authStore";

const adminNav = [
  { to: "/staff/dashboard", label: "Overview", icon: <span className="h-4 w-4 rounded bg-current opacity-40" /> },
  { to: "/staff/vendors", label: "Vendor verification", icon: <span className="h-4 w-4 rounded-full border-2 border-current" /> },
  { to: "/staff/leads", label: "Leads", icon: <span className="h-4 w-4 rounded bg-current opacity-30" /> },
  { to: "/staff/orders", label: "Orders", icon: <span className="h-4 w-4 rounded bg-current opacity-40" /> },
  { to: "/staff/catalog", label: "Products & services", icon: <span className="h-4 w-4 rounded-full bg-current opacity-30" /> },
  { to: "/staff/complaints", label: "Complaints", icon: <span className="h-4 w-4 rotate-45 bg-current opacity-30" /> },
];

const superAdminNav = [
  { to: "/staff/super-admin", label: "Overview", icon: <span className="h-4 w-4 rounded bg-current opacity-40" /> },
  { to: "/staff/super-admin/branches", label: "Branches", icon: <span className="h-4 w-4 rounded-full border-2 border-current" /> },
  { to: "/staff/super-admin/admins", label: "Admins", icon: <span className="h-4 w-4 rounded bg-current opacity-30" /> },
  { to: "/staff/super-admin/users", label: "Users", icon: <span className="h-4 w-4 rounded-full bg-current opacity-30" /> },
  { to: "/staff/super-admin/audit-logs", label: "Audit logs", icon: <span className="h-4 w-4 rounded bg-current opacity-40" /> },
  { to: "/staff/super-admin/settings", label: "Settings", icon: <span className="h-4 w-4 rounded-full bg-current opacity-30" /> },
];

export function StaffPortalLayout() {
  const navigate = useNavigate();
  const { user, logout } = useStaffAuth();
  const isSuperAdmin = user?.role === "SADMIN";

  return (
    <PortalShell
      navItems={isSuperAdmin ? superAdminNav : adminNav}
      accent={isSuperAdmin ? "gold" : "slate"}
      portalLabel={isSuperAdmin ? "Super-admin portal" : "Admin portal"}
      userLabel={user?.email ?? "Staff"}
      userMeta={user?.role}
      onLogout={() => {
        logout();
        navigate("/staff/login");
      }}
    >
      <Outlet />
    </PortalShell>
  );
}
