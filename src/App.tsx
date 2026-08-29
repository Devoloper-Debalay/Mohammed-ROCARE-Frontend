import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "@/portals/landing/LandingPage";

import { CustomerLoginPage } from "@/portals/customer/CustomerLoginPage";
import { CustomerSignupPage } from "@/portals/customer/CustomerSignupPage";
import { CustomerPortalLayout } from "@/portals/customer/CustomerPortalLayout";
import { CustomerDashboardPage } from "@/portals/customer/CustomerDashboardPage";
import { CustomerCatalogPage } from "@/portals/customer/CustomerCatalogPage";
import { CustomerCartPage } from "@/portals/customer/CustomerCartPage";
import { CustomerAddressesPage } from "@/portals/customer/CustomerAddressesPage";
import { CustomerOrdersPage } from "@/portals/customer/CustomerOrdersPage";
import { CustomerServiceRequestsPage, CustomerComplaintsPage, CustomerNotificationsPage } from "@/portals/customer/CustomerPlaceholders";

import { VendorLoginPage } from "@/portals/vendor/VendorLoginPage";
import { VendorSignupPage } from "@/portals/vendor/VendorSignupPage";
import { VendorPortalLayout } from "@/portals/vendor/VendorPortalLayout";
import { VendorDashboardPage } from "@/portals/vendor/VendorDashboardPage";
import { VendorLeadsPage } from "@/portals/vendor/VendorLeadsPage";
import { VendorWalletPage } from "@/portals/vendor/VendorWalletPage";
import { VendorProfilePage } from "@/portals/vendor/VendorProfilePage";
import { VendorProductsPage, VendorOffersPage, VendorComplaintsPage, VendorNotificationsPage } from "@/portals/vendor/VendorPlaceholders";

import { StaffLoginPage } from "@/portals/admin/StaffLoginPage";
import { StaffPortalLayout } from "@/portals/admin/StaffPortalLayout";
import { AdminDashboardPage } from "@/portals/admin/AdminDashboardPage";
import { SuperAdminDashboardPage } from "@/portals/admin/SuperAdminDashboardPage";
import {
  AdminVendorsPage,
  AdminLeadsPage,
  AdminOrdersPage,
  AdminCatalogPage,
  AdminComplaintsPage,
  SuperAdminBranchesPage,
  SuperAdminAdminsPage,
  SuperAdminUsersPage,
  SuperAdminAuditLogsPage,
  SuperAdminSettingsPage,
} from "@/portals/admin/AdminPlaceholders";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useCustomerAuth, useVendorAuth, useStaffAuth } from "@/store/authStore";

function CustomerRoutes() {
  const isAuthenticated = useCustomerAuth((s) => s.isAuthenticated);
  return (
    <Routes>
      <Route path="login" element={<CustomerLoginPage />} />
      <Route path="signup" element={<CustomerSignupPage />} />
      <Route
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} redirectTo="/customer/login">
            <CustomerPortalLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<CustomerDashboardPage />} />
        <Route path="catalog" element={<CustomerCatalogPage />} />
        <Route path="cart" element={<CustomerCartPage />} />
        <Route path="orders" element={<CustomerOrdersPage />} />
        <Route path="addresses" element={<CustomerAddressesPage />} />
        <Route path="service-requests" element={<CustomerServiceRequestsPage />} />
        <Route path="complaints" element={<CustomerComplaintsPage />} />
        <Route path="notifications" element={<CustomerNotificationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? "dashboard" : "login"} replace />} />
    </Routes>
  );
}

function VendorRoutes() {
  const isAuthenticated = useVendorAuth((s) => s.isAuthenticated);
  return (
    <Routes>
      <Route path="login" element={<VendorLoginPage />} />
      <Route path="signup" element={<VendorSignupPage />} />
      <Route
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} redirectTo="/vendor/login">
            <VendorPortalLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<VendorDashboardPage />} />
        <Route path="leads" element={<VendorLeadsPage />} />
        <Route path="wallet" element={<VendorWalletPage />} />
        <Route path="products" element={<VendorProductsPage />} />
        <Route path="offers" element={<VendorOffersPage />} />
        <Route path="complaints" element={<VendorComplaintsPage />} />
        <Route path="profile" element={<VendorProfilePage />} />
        <Route path="notifications" element={<VendorNotificationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? "dashboard" : "login"} replace />} />
    </Routes>
  );
}

function StaffRoutes() {
  const { isAuthenticated, user } = useStaffAuth();
  const isSuperAdmin = user?.role === "SADMIN";
  return (
    <Routes>
      <Route path="login" element={<StaffLoginPage />} />
      <Route
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} redirectTo="/staff/login">
            <StaffPortalLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="vendors" element={<AdminVendorsPage />} />
        <Route path="leads" element={<AdminLeadsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="catalog" element={<AdminCatalogPage />} />
        <Route path="complaints" element={<AdminComplaintsPage />} />

        <Route path="super-admin" element={isSuperAdmin ? <SuperAdminDashboardPage /> : <Navigate to="/staff/dashboard" replace />} />
        <Route path="super-admin/branches" element={isSuperAdmin ? <SuperAdminBranchesPage /> : <Navigate to="/staff/dashboard" replace />} />
        <Route path="super-admin/admins" element={isSuperAdmin ? <SuperAdminAdminsPage /> : <Navigate to="/staff/dashboard" replace />} />
        <Route path="super-admin/users" element={isSuperAdmin ? <SuperAdminUsersPage /> : <Navigate to="/staff/dashboard" replace />} />
        <Route path="super-admin/audit-logs" element={isSuperAdmin ? <SuperAdminAuditLogsPage /> : <Navigate to="/staff/dashboard" replace />} />
        <Route path="super-admin/settings" element={isSuperAdmin ? <SuperAdminSettingsPage /> : <Navigate to="/staff/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? (isSuperAdmin ? "super-admin" : "dashboard") : "login"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/customer/*" element={<CustomerRoutes />} />
        <Route path="/vendor/*" element={<VendorRoutes />} />
        <Route path="/staff/*" element={<StaffRoutes />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
