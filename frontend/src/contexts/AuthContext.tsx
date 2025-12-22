import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthApi } from '../api/authApi';
import type { LoginDTO } from '../DTOs/LoginDTO';
import { MunicipalityOfficerResponseDTO } from '../DTOs/MunicipalityOfficerResponseDTO';
import {UserResponseDTO} from "../DTOs/UserResponseDTO";
import {CreateUserRequestDTO} from "../DTOs/CreateUserRequestDTO";
import { initSocketClient, getSocket } from "../services/socketClient";
type AuthContextType = {
  user: UserResponseDTO | null;
  loading: boolean;            // true while initial session fetch is pending
  isAuthenticated: boolean;
  role: string | null;
  isExternal: boolean;
  companyName: string | null;
  login: (creds: LoginDTO) => Promise<UserResponseDTO | MunicipalityOfficerResponseDTO | null>;
  register: (payload: CreateUserRequestDTO) => Promise<UserResponseDTO | null>;
  logout: () => Promise<void>;
  setUser: (u: UserResponseDTO | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const authApi = new AuthApi();

  // 1) initial session load — AuthProvider owns the query
  const { data: user, isLoading } = useQuery<UserResponseDTO | null>({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        const s = await authApi.getSession();
        // normalize: only accept a proper user-shaped object, otherwise return null
        if (!s || typeof s !== 'object') return null;
        // check if user has username property
        if (!('username' in (s as any))) return null;
        return s as UserResponseDTO;
      } catch (err) {
        console.error("Failed to load user session:", err);
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: true,
  });

  // 2) mutations — owned by the provider so it remains the single source of truth
  const loginMutation = useMutation({
    mutationFn: (creds: LoginDTO) => authApi.login(creds),
    onSuccess: (res) => {
      const u = (res as any)?.data as UserResponseDTO | MunicipalityOfficerResponseDTO ?? res;
      qc.setQueryData(['session'], u ?? null);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: CreateUserRequestDTO) => authApi.registerUser(payload),
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
  const login = async (creds: LoginDTO) : Promise<UserResponseDTO | MunicipalityOfficerResponseDTO | null> => {
    const res = await loginMutation.mutateAsync(creds);
    return (res as any)?.data ?? res ?? null;
  };

  const register = async (payload: CreateUserRequestDTO) => {
    const res = await registerMutation.mutateAsync(payload);
    return (res as any)?.data ?? res ?? null;
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
    // session is already cleared in onSuccess; optionally also clear other caches
    const socket = getSocket();
    socket?.disconnect();
  };

  const setUser = (u: UserResponseDTO | MunicipalityOfficerResponseDTO | null) => {
    qc.setQueryData(['session'], u);
  };
  useEffect(() => {
    if (!user) return;

    const role = resolveRole(user);

    if (role === "USER") {
      initSocketClient({ UserUsername: user.username });
      return;
    }

    if (role?.startsWith("TECH") || role === "ORGANIZATION_OFFICER") {
      initSocketClient({ OfficerUsername: user.username });
      return;
    }
  }, [user]);

  const value = useMemo<AuthContextType>(() => ({
    user: user ?? null,
    loading: isLoading,
    isAuthenticated: !!user,
    role: resolveRole(user),
    login,
    register,
    logout,
    setUser,
    isExternal: user ? (user as MunicipalityOfficerResponseDTO).external === true : false,
    companyName: user ? (user as MunicipalityOfficerResponseDTO).companyName : null,
  }), [user, isLoading]); // keep stable identity

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
const resolveRole = (user: any): string | null => {
  if (!user) return null;

  if (!("roles" in user)) return "USER"; // regular user has no role property
  if (user.roles === null) return null; // officer with no assigned role



  return user.roles[0] ?? null; 
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}