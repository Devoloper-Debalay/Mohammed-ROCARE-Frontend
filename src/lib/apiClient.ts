import axios, { type AxiosInstance } from "axios";
import { API_BASE_URL } from "./env";

export type PortalKey = "customer" | "vendor" | "admin";

const storageKey = (portal: PortalKey, field: "token" | "refreshToken" | "user") =>
  `rocare.${portal}.${field}`;

export const portalStorage = {
  getToken: (portal: PortalKey) => localStorage.getItem(storageKey(portal, "token")),
  getRefreshToken: (portal: PortalKey) => localStorage.getItem(storageKey(portal, "refreshToken")),
  getUser: <T,>(portal: PortalKey): T | null => {
    const raw = localStorage.getItem(storageKey(portal, "user"));
    return raw ? (JSON.parse(raw) as T) : null;
  },
  setSession: (portal: PortalKey, data: { token: string; refreshToken?: string; user: unknown }) => {
    localStorage.setItem(storageKey(portal, "token"), data.token);
    if (data.refreshToken) localStorage.setItem(storageKey(portal, "refreshToken"), data.refreshToken);
    localStorage.setItem(storageKey(portal, "user"), JSON.stringify(data.user));
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
