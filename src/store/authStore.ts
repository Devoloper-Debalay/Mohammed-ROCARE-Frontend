import { create } from "zustand";
import { type PortalKey, portalStorage } from "@/lib/apiClient";

interface AuthState<TUser> {
  user: TUser | null;
  isAuthenticated: boolean;
  setSession: (data: { token?: string; accessToken?: string; refreshToken?: string; user?: TUser | null }) => void;
  logout: () => void;
}

function createAuthStore<TUser>(portal: PortalKey) {
  return create<AuthState<TUser>>((set) => ({
    user: portalStorage.getUser<TUser>(portal),
    isAuthenticated: Boolean(portalStorage.getToken(portal)),
    setSession: (data) => {
      portalStorage.setSession(portal, data);
      const token = data.token || data.accessToken;
      set({
        user: (data.user as TUser) ?? null,
        isAuthenticated: Boolean(token && token !== "undefined" && token !== "null" && token.trim() !== ""),
      });
    },
    logout: () => {
      portalStorage.clear(portal);
      set({ user: null, isAuthenticated: false });
    },
  }));
}

export interface CustomerUser {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
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
  fullName?: string;
  email: string;
  role: "ADMIN" | "SADMIN";
  jobTitle?: string;
}

export const useCustomerAuth = createAuthStore<CustomerUser>("customer");
export const useVendorAuth = createAuthStore<VendorUser>("vendor");
export const useStaffAuth = createAuthStore<StaffUser>("admin");
