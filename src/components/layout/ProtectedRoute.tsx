import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ isAuthenticated, redirectTo, children }: { isAuthenticated: boolean; redirectTo: string; children: ReactNode }) {
  if (!isAuthenticated) return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
}
