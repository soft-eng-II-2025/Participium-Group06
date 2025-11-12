import {AuthApi} from "../api/authApi";
import {useMutation} from "@tanstack/react-query";
import {UserResponseDTO} from "../DTOs/UserResponseDTO";
import {LoginDTO} from "../DTOs/LoginDTO";

const authApi = new AuthApi();

export function useRegisterUser(){
    return useMutation({
        mutationFn: (newUser: UserResponseDTO) => authApi.registerUser(newUser)
    })
}

export function useLogin(){
    return useMutation({
        mutationFn: (credentials: LoginDTO) => authApi.login(credentials)
    })
}