import { create } from "zustand";
import { type PortalKey, portalStorage } from "@/lib/apiClient";

interface AuthState<TUser> {
  user: TUser | null;
  isAuthenticated: boolean;
  setSession: (data: { token?: string; accessToken?: string; refreshToken?: string; user?: TUser | null }) => void;
  /**
   * Merges partial fields into the current user without touching the token —
   * unlike setSession, which treats a missing token as "log this session out".
   * Use this for background profile refreshes / partial edits.
   */
  updateUser: (updates: Partial<TUser>) => void;
  logout: () => void;
}

function createAuthStore<TUser>(portal: PortalKey) {
  return create<AuthState<TUser>>((set, get) => ({
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
    updateUser: (updates) => {
      const merged = { ...(get().user as object), ...updates } as TUser;
      portalStorage.setUser(portal, merged);
      set({ user: merged });
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
  fullName?: string;
  email?: string;
  phone?: string;
  referralCode?: string;
  address?: string;
  city?: string;
  pincode?: string;
}

export interface VendorUser {
  id: string;
  fullName: string;
  role: "AGENT" | "TECHNICIAN";
  vendorCode: string;
  phone: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  profileStatus?: "DRAFT" | "UNDER_REVIEW" | "PUBLISHED" | "BLOCKED" | "DELETED";
}

export function isVendorApproved(user: VendorUser | null): boolean {
  return user?.verificationStatus === "VERIFIED" && user?.profileStatus === "PUBLISHED";
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
