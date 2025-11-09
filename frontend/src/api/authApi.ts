import axios from "axios";
import {UserDTO} from "../DTOs/UserDTO";
import {LoginDTO} from "../DTOs/LoginDTO";


const BASE_URL = "/api";

export class AuthApi {

    async registerUser(params: UserDTO) {
        return axios.post <UserDTO>(`${BASE_URL}/register`, params);
    }

    async login(params: LoginDTO) {
        return axios.post <UserDTO>(`${BASE_URL}/login`, params);
    }

}