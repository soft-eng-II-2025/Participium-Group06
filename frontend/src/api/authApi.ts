import api from "./api";
import {UserResponseDTO} from "../DTOs/UserResponseDTO";
import {LoginDTO} from "../DTOs/LoginDTO";
import {MunicipalityOfficerResponseDTO} from "../DTOs/MunicipalityOfficerResponseDTO";
import {CreateUserRequestDTO} from "../DTOs/CreateUserRequestDTO";


export class AuthApi {


    async registerUser(params: CreateUserRequestDTO) {
        return api.post<UserResponseDTO>(`/register`, params);
    }

    async login(params: LoginDTO) {
        return api.post<UserResponseDTO | MunicipalityOfficerResponseDTO>(`/login`, params);
    }

    async logout() {
        return api.post(`/logout`);
    }

    async getSession(): Promise<UserResponseDTO | MunicipalityOfficerResponseDTO | null> {
        const res = await api.get<UserResponseDTO | MunicipalityOfficerResponseDTO | null>(`/session`);
        return res.data;
    }

    async confirmEmail(username: string, code: string) {
        return api.post(`/verify`, { username, code });
    }
    
}