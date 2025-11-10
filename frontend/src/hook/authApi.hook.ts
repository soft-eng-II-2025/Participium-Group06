import {AuthApi} from "../api/authApi";
import {useMutation} from "@tanstack/react-query";
import {UserDTO} from "../DTOs/UserDTO";
import {LoginDTO} from "../DTOs/LoginDTO";

const authApi = new AuthApi();

export function useRegisterUser(){
    return useMutation({
        mutationFn: (newUser: UserDTO) => authApi.registerUser(newUser)
    })
}

export function useLogin(){
    return useMutation({
        mutationFn: (credentials: LoginDTO) => authApi.login(credentials)
    })
}