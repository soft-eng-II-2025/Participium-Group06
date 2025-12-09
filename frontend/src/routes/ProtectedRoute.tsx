import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }: { readonly children: React.ReactElement }) {
  const { isAuthenticated, loading, user, role } = useAuth();
  const location = useLocation();

  if (loading) return null;

  const isUnverifiedUser = !!(
    user && (role === "USER" || !("role" in (user as any))) && (
      ((user as any).verified === false)
    )
  );

  if (isAuthenticated && isUnverifiedUser) {
    return <Navigate to="/confirm-email" state={{ from: location }} replace />;
  }

  return isAuthenticated ? children : <Navigate to="/login" state={{ from: location }} replace />;
}

export function RequireUnverifiedUser({ children }: { readonly children: React.ReactElement }) {
  const { isAuthenticated, loading, user, role } = useAuth();
  const location = useLocation();

  if (loading) return null;

  const isUnverifiedUser = !!(
    user && role === "USER" && (
      (user?.verified === false)
    )
  );

  if (!isAuthenticated || !isUnverifiedUser) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}