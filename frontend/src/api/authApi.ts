import axios from "axios";
import {UserResponseDTO} from "../DTOs/UserResponseDTO";
import {LoginDTO} from "../DTOs/LoginDTO";
import {MunicipalityOfficerResponseDTO} from "../DTOs/MunicipalityOfficerResponseDTO";
import {CreateUserRequestDTO} from "../DTOs/CreateUserRequestDTO";


const BASE_URL = "/api";

export class AuthApi {

    async registerUser(params: CreateUserRequestDTO) {
        return axios.post <UserResponseDTO>(`${BASE_URL}/register`, params);
    }

    async login(params: LoginDTO) {
        return axios.post <UserResponseDTO|MunicipalityOfficerResponseDTO>(`${BASE_URL}/login`, params);
    }

}