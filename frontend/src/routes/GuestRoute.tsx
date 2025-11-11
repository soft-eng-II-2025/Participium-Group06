import React, { JSX } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function GuestRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  return !isAuthenticated ? (
    children
  ) : (
    <Navigate to={(location.state as any)?.from?.pathname ?? '/'} replace />
  );
}