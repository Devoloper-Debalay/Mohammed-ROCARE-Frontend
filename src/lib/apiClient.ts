import axios, { type AxiosInstance } from "axios";
import { API_BASE_URL } from "./env";

export type PortalKey = "customer" | "vendor" | "admin";

const storageKey = (portal: PortalKey, field: "token" | "refreshToken" | "user") =>
  `rocare.${portal}.${field}`;

export const portalStorage = {
  getToken: (portal: PortalKey): string | null => {
    const token = localStorage.getItem(storageKey(portal, "token"));
    return token && token !== "undefined" && token !== "null" && token.trim() !== "" ? token : null;
  },
  getRefreshToken: (portal: PortalKey): string | null => {
    const token = localStorage.getItem(storageKey(portal, "refreshToken"));
    return token && token !== "undefined" && token !== "null" && token.trim() !== "" ? token : null;
  },
  getUser: <T,>(portal: PortalKey): T | null => {
    const raw = localStorage.getItem(storageKey(portal, "user"));
    if (!raw || raw === "undefined" || raw === "null") return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setSession: (
    portal: PortalKey,
    data: { token?: string; accessToken?: string; refreshToken?: string; user?: unknown }
  ) => {
    const token = data.token || data.accessToken;
    if (token && token !== "undefined" && token !== "null" && token.trim() !== "") {
      localStorage.setItem(storageKey(portal, "token"), token);
    } else {
      localStorage.removeItem(storageKey(portal, "token"));
    }

    if (data.refreshToken && data.refreshToken !== "undefined" && data.refreshToken !== "null" && data.refreshToken.trim() !== "") {
      localStorage.setItem(storageKey(portal, "refreshToken"), data.refreshToken);
    } else {
      localStorage.removeItem(storageKey(portal, "refreshToken"));
    }

    if (data.user !== undefined && data.user !== null && data.user !== "undefined" && data.user !== "null") {
      localStorage.setItem(storageKey(portal, "user"), JSON.stringify(data.user));
    } else {
      localStorage.removeItem(storageKey(portal, "user"));
    }
  },
  clear: (portal: PortalKey) => {
    localStorage.removeItem(storageKey(portal, "token"));
    localStorage.removeItem(storageKey(portal, "refreshToken"));
    localStorage.removeItem(storageKey(portal, "user"));
  },
};

/**
 * Each portal gets its own axios instance and its own token storage bucket.
 * A customer session can never leak into the vendor client (or vice versa) —
 * there's no shared "current user" anywhere in the app.
 */
export function createApiClient(portal: PortalKey): AxiosInstance {
  const client = axios.create({ baseURL: API_BASE_URL });

  client.interceptors.request.use((config) => {
    const token = portalStorage.getToken(portal);
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        portalStorage.clear(portal);
        const loginPath = portal === "customer" ? "/customer/login" : portal === "vendor" ? "/vendor/login" : "/staff/login";
        if (window.location.pathname !== loginPath) {
          window.location.href = loginPath;
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export const customerApi = createApiClient("customer");
export const vendorApi = createApiClient("vendor");
export const adminApi = createApiClient("admin");

export interface ApiSuccessBody<T = unknown> {
  success: true;
  message: string;
  data?: T;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

/**
 * Safely unwraps an API response that may be a direct array, { data: [...] },
 * { items: [...] }, or { rows: [...] } to prevent runtime `.map()` crashes.
 */
export function unwrapList<T = any>(payload: unknown): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as T[];
  const obj = payload as Record<string, any>;
  if (Array.isArray(obj.data)) return obj.data as T[];
  if (Array.isArray(obj.items)) return obj.items as T[];
  if (Array.isArray(obj.rows)) return obj.rows as T[];
  if (Array.isArray(obj.branches)) return obj.branches as T[];
  if (Array.isArray(obj.admins)) return obj.admins as T[];
  if (Array.isArray(obj.users)) return obj.users as T[];
  if (Array.isArray(obj.products)) return obj.products as T[];
  if (Array.isArray(obj.services)) return obj.services as T[];
  if (Array.isArray(obj.parts)) return obj.parts as T[];
  if (Array.isArray(obj.leads)) return obj.leads as T[];
  if (Array.isArray(obj.orders)) return obj.orders as T[];
  if (Array.isArray(obj.payments)) return obj.payments as T[];
  if (Array.isArray(obj.complaints)) return obj.complaints as T[];
  if (Array.isArray(obj.notifications)) return obj.notifications as T[];
  return [];
}

