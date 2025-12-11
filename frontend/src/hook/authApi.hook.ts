import {AuthApi} from "../api/authApi";
import { useAuth } from '../contexts/AuthContext';
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {UserResponseDTO} from "../DTOs/UserResponseDTO";
import {LoginDTO} from "../DTOs/LoginDTO";
import {CreateUserRequestDTO} from "../DTOs/CreateUserRequestDTO";


// Wrapper hooks that expose a small react-query-like surface but delegate to AuthContext.
// This keeps component usage unchanged while centralizing auth logic in the provider


const authApi = new AuthApi();

export function useRegisterUser() {
    const { register } = useAuth();
    return {
        mutateAsync: async (payload: CreateUserRequestDTO) => {
            return await register(payload);
        },
        mutate: (payload: CreateUserRequestDTO) => { void register(payload); },
    };
}

export function useLogin() {
    const { login } = useAuth();
    return {
        mutateAsync: async (creds: LoginDTO) => {
            return await login(creds);
        },
        mutate: (creds: LoginDTO) => { void login(creds); },
    };
}

export function useGetSession() {
    const { user, loading, isAuthenticated } = useAuth();
    return {
        data: user,
        isLoading: loading,
        isAuthenticated,
    };
}

export function useLogout() {
    const { logout } = useAuth();
    return {
        mutateAsync: async () => {
            return await logout();
        },
        mutate: () => { void logout(); },
    };
}

export function useConfirmEmail() {
    const { user } = useAuth();
    const qc = useQueryClient();

    const mutation = useMutation({
        mutationFn: (code: string) => {
            if (!user) return Promise.reject(new Error('NO_USER'));
            return authApi.confirmEmail(user.username, code);
        },
        onSuccess: () => {
            // Update session cache so AuthContext sees the verified flag immediately
            qc.setQueryData(['session'], (old: any) => {
                if (!old) return old;
                return { ...old, verified: true };
            });
        }
    });

    return {
        mutateAsync: async (code: string) => mutation.mutateAsync(code),
        mutate: (code: string) => { mutation.mutate(code); },
    };
}