import { create } from "zustand";
import { type PortalKey, portalStorage } from "@/lib/apiClient";

interface AuthState<TUser> {
  user: TUser | null;
  isAuthenticated: boolean;
  setSession: (data: { token: string; refreshToken?: string; user: TUser }) => void;
  logout: () => void;
}

function createAuthStore<TUser>(portal: PortalKey) {
  return create<AuthState<TUser>>((set) => ({
    user: portalStorage.getUser<TUser>(portal),
    isAuthenticated: Boolean(portalStorage.getToken(portal)),
    setSession: (data) => {
      portalStorage.setSession(portal, data);
      set({ user: data.user, isAuthenticated: true });
    },
    logout: () => {
      portalStorage.clear(portal);
      set({ user: null, isAuthenticated: false });
    },
  }));
}

export interface CustomerUser {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export interface VendorUser {
  id: string;
  fullName: string;
  role: "AGENT" | "TECHNICIAN";
  vendorCode: string;
  phone: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
}

export interface StaffUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: "ADMIN" | "SADMIN";
  jobTitle?: string;
}

export const useCustomerAuth = createAuthStore<CustomerUser>("customer");
export const useVendorAuth = createAuthStore<VendorUser>("vendor");
export const useStaffAuth = createAuthStore<StaffUser>("admin");
