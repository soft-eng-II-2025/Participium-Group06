import { useAuth } from '../contexts/AuthContext';
import type { UserDTO } from '../DTOs/UserDTO';
import type { LoginDTO } from '../DTOs/LoginDTO';

// Wrapper hooks that expose a small react-query-like surface but delegate to AuthContext.
// This keeps component usage unchanged while centralizing auth logic in the provider.

export function useRegisterUser() {
    const { register } = useAuth();
    return {
        mutateAsync: async (payload: UserDTO) => {
            return await register(payload);
        },
        // convenience: compatible signature for callers that call mutate
        mutate: (payload: UserDTO) => { void register(payload); },
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