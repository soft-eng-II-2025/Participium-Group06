import {UserDTO} from "../DTOs/UserDTO";
import {LoginDTO} from "../DTOs/LoginDTO";
import {MunicipalityOfficerDTO} from "../DTOs/MunicipalityOfficerDTO";
import api from "./api";



export class AuthApi {

    async registerUser(params: UserDTO) {
        return api.post<UserDTO>(`/register`, params);
    }

    async login(params: LoginDTO) {
        return api.post<UserDTO | MunicipalityOfficerDTO>(`/login`, params);
    }

    async logout() {
        return api.post(`/logout`);
    }

    async getSession(): Promise<UserDTO | MunicipalityOfficerDTO | null> {
        const res = await api.get<UserDTO | MunicipalityOfficerDTO | null>(`/session`);
        return res.data;
    }
}