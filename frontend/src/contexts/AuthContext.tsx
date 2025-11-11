import React, { createContext, useContext, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthApi } from '../api/authApi';
import type { UserDTO } from '../DTOs/UserDTO';
import type { LoginDTO } from '../DTOs/LoginDTO';
import { MunicipalityOfficerDTO } from '../DTOs/MunicipalityOfficerDTO';

type AuthContextType = {
  user: UserDTO | null;
  loading: boolean;            // true while initial session fetch is pending
  isAuthenticated: boolean;
  role: string | null;
  login: (creds: LoginDTO) => Promise<UserDTO | null>;
  register: (payload: UserDTO) => Promise<UserDTO | null>;
  logout: () => Promise<void>;
  setUser: (u: UserDTO | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const authApi = new AuthApi();

  // 1) initial session load — AuthProvider owns the query
  const { data: user, isLoading } = useQuery<UserDTO | null>({
    queryKey: ['session'],
    queryFn: () => authApi.getSession(),
    retry: false,
    refetchOnWindowFocus: true,
  });

  // 2) mutations — owned by the provider so it remains the single source of truth
  const loginMutation = useMutation({
    mutationFn: (creds: LoginDTO) => authApi.login(creds),
    onSuccess: (res) => {
      const u = (res as any)?.data as UserDTO | MunicipalityOfficerDTO ?? res;
      qc.setQueryData(['session'], u ?? null);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: UserDTO) => authApi.registerUser(payload),
    onSuccess: (res) => {
      const u = (res as any)?.data ?? res;
      qc.setQueryData(['session'], u ?? null);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      qc.setQueryData(['session'], null);
    },
  });

  // plain functions for components to call (these don't call hooks)
  const login = async (creds: LoginDTO) : Promise<UserDTO | MunicipalityOfficerDTO | null> => {
    const res = await loginMutation.mutateAsync(creds);
    return (res as any)?.data ?? res ?? null;
  };

  const register = async (payload: UserDTO) => {
    const res = await registerMutation.mutateAsync(payload);
    return (res as any)?.data ?? res ?? null;
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
    // session is already cleared in onSuccess; optionally also clear other caches
  };

  const setUser = (u: UserDTO | MunicipalityOfficerDTO | null) => {
    qc.setQueryData(['session'], u);
  };

  const value = useMemo<AuthContextType>(() => ({
    user: user ?? null,
    loading: isLoading,
    isAuthenticated: !!user,
    role: user ? ((user as MunicipalityOfficerDTO)?.role?.title ?? 'user') : null,
    login,
    register,
    logout,
    setUser,
  }), [user, isLoading]); // keep stable identity

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}