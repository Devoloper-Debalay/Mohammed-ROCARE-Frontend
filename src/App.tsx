import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { LandingPage } from "@/portals/landing/LandingPage";

import { CustomerLoginPage } from "@/portals/customer/CustomerLoginPage";
import { CustomerSignupPage } from "@/portals/customer/CustomerSignupPage";
import { CustomerPortalLayout } from "@/portals/customer/CustomerPortalLayout";
import { CustomerDashboardPage } from "@/portals/customer/CustomerDashboardPage";
import { CustomerCatalogPage } from "@/portals/customer/CustomerCatalogPage";
import { CustomerCartPage } from "@/portals/customer/CustomerCartPage";
import { CustomerAddressesPage } from "@/portals/customer/CustomerAddressesPage";
import { CustomerOrdersPage } from "@/portals/customer/CustomerOrdersPage";
import { CustomerServiceRequestsPage } from "@/portals/customer/CustomerServiceRequestsPage";
import { CustomerComplaintsPage } from "@/portals/customer/CustomerComplaintsPage";
import { CustomerNotificationsPage } from "@/portals/customer/CustomerNotificationsPage";
import { CustomerProfilePage } from "@/portals/customer/CustomerProfilePage";
import { CustomerOffersPage } from "@/portals/customer/CustomerOffersPage";

import { VendorLoginPage } from "@/portals/vendor/VendorLoginPage";
import { VendorSignupPage } from "@/portals/vendor/VendorSignupPage";
import { VendorPortalLayout } from "@/portals/vendor/VendorPortalLayout";
import { VendorDashboardPage } from "@/portals/vendor/VendorDashboardPage";
import { VendorLeadsPage } from "@/portals/vendor/VendorLeadsPage";
import { VendorLeadDetailPage } from "@/portals/vendor/VendorLeadDetailPage";
import { VendorWalletPage } from "@/portals/vendor/VendorWalletPage";
import { VendorProfilePage } from "@/portals/vendor/VendorProfilePage";
import { VendorProductsPage } from "@/portals/vendor/VendorProductsPage";
import { VendorOffersPage } from "@/portals/vendor/VendorOffersPage";
import { VendorComplaintsPage } from "@/portals/vendor/VendorComplaintsPage";
import { VendorNotificationsPage } from "@/portals/vendor/VendorNotificationsPage";

import { StaffLoginPage } from "@/portals/admin/StaffLoginPage";
import { StaffPortalLayout } from "@/portals/admin/StaffPortalLayout";
import { AdminDashboardPage } from "@/portals/admin/AdminDashboardPage";
import { AdminVendorsPage } from "@/portals/admin/AdminVendorsPage";
import { AdminLeadsPage } from "@/portals/admin/AdminLeadsPage";
import { AdminOrdersPage } from "@/portals/admin/AdminOrdersPage";
import { AdminCatalogPage } from "@/portals/admin/AdminCatalogPage";
import { AdminPaymentsPage } from "@/portals/admin/AdminPaymentsPage";
import { AdminWalletPage } from "@/portals/admin/AdminWalletPage";
import { AdminComplaintsPage } from "@/portals/admin/AdminComplaintsPage";
import { SuperAdminDashboardPage } from "@/portals/admin/SuperAdminDashboardPage";
import { SuperAdminBranchesPage } from "@/portals/admin/SuperAdminBranchesPage";
import { SuperAdminAdminsPage } from "@/portals/admin/SuperAdminAdminsPage";
import { SuperAdminUsersPage } from "@/portals/admin/SuperAdminUsersPage";
import { SuperAdminAuditLogsPage } from "@/portals/admin/SuperAdminAuditLogsPage";
import { SuperAdminSettingsPage } from "@/portals/admin/SuperAdminSettingsPage";
import { SuperAdminReportsPage } from "@/portals/admin/SuperAdminReportsPage";

import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
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
        <Route path="offers" element={<CustomerOffersPage />} />
        <Route path="addresses" element={<CustomerAddressesPage />} />
        <Route path="profile" element={<CustomerProfilePage />} />
        <Route path="service-requests" element={<CustomerServiceRequestsPage />} />
        <Route path="complaints" element={<CustomerComplaintsPage />} />
        <Route path="notifications" element={<CustomerNotificationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? "/customer/dashboard" : "/customer/login"} replace />} />
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
        <Route path="leads/:leadId" element={<VendorLeadDetailPage />} />
        <Route path="wallet" element={<VendorWalletPage />} />
        <Route path="products" element={<VendorProductsPage />} />
        <Route path="offers" element={<VendorOffersPage />} />
        <Route path="complaints" element={<VendorComplaintsPage />} />
        <Route path="profile" element={<VendorProfilePage />} />
        <Route path="notifications" element={<VendorNotificationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? "/vendor/dashboard" : "/vendor/login"} replace />} />
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
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="catalog" element={<AdminCatalogPage />} />
        <Route path="wallet" element={<AdminWalletPage />} />
        <Route path="complaints" element={<AdminComplaintsPage />} />

        <Route path="super-admin" element={isSuperAdmin ? <SuperAdminDashboardPage /> : <Navigate to="/staff/dashboard" replace />} />
        <Route path="super-admin/branches" element={isSuperAdmin ? <SuperAdminBranchesPage /> : <Navigate to="/staff/dashboard" replace />} />
        <Route path="super-admin/admins" element={isSuperAdmin ? <SuperAdminAdminsPage /> : <Navigate to="/staff/dashboard" replace />} />
        <Route path="super-admin/users" element={isSuperAdmin ? <SuperAdminUsersPage /> : <Navigate to="/staff/dashboard" replace />} />
        <Route path="super-admin/audit-logs" element={isSuperAdmin ? <SuperAdminAuditLogsPage /> : <Navigate to="/staff/dashboard" replace />} />
        <Route path="super-admin/settings" element={isSuperAdmin ? <SuperAdminSettingsPage /> : <Navigate to="/staff/dashboard" replace />} />
        <Route path="super-admin/reports" element={isSuperAdmin ? <SuperAdminReportsPage /> : <Navigate to="/staff/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? (isSuperAdmin ? "/staff/super-admin" : "/staff/dashboard") : "/staff/login"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/customer/*" element={<CustomerRoutes />} />
            <Route path="/vendor/*" element={<VendorRoutes />} />
            <Route path="/staff/*" element={<StaffRoutes />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
