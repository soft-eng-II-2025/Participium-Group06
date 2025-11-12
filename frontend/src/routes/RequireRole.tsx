import React, { JSX } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RequireRole({ children, role }: { children: JSX.Element; role: string }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return null; // or a loader

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  const hasRole =
    (user as any)?.role?.title === role;
    

  if (!hasRole) return <Navigate to="/" replace />; // or render a 403 page

  return children;
}