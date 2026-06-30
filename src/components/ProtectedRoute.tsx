import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { Role } from "../types";
import { useAuthStore } from "../store/authStore";

interface ProtectedRouteProps {
  allowedRoles: Role[];
  children: ReactNode;
}

export const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
