import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { Role } from "../types";
import { useAuthStore } from "../store/authStore";
import { Loader } from "./Loader";

interface ProtectedRouteProps {
  allowedRoles: Role[];
  children: ReactNode;
}

export const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [isHydrated, setIsHydrated] = useState(useAuthStore.persist?.hasHydrated() ?? true);

  useEffect(() => {
    if (useAuthStore.persist?.hasHydrated) {
      setIsHydrated(useAuthStore.persist.hasHydrated());
      const unsub = useAuthStore.persist.onFinishHydration(() => setIsHydrated(true));
      return () => unsub();
    }
  }, []);

  if (!isHydrated) {
    return (
      <div className="mx-auto mt-16 max-w-6xl p-6">
        <Loader label="Restoring session..." />
      </div>
    );
  }

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const fallbackPath = user.role === "DOCTOR" ? "/doctor-dashboard" : user.role === "TECHNICIAN" ? "/lab-dashboard" : "/admin/dashboard";
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};
