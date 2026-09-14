import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";

export default function PermissionRoute({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const { profile } = useAuth();
  return profile?.permisos.includes(permission) ? children : <Navigate to="/" replace />;
}
