import api from "./api";
import {MunicipalityOfficerDTO} from "../DTOs/MunicipalityOfficerDTO";
import { RoleDTO } from "../DTOs/RoleDTO";


const BASE_URL = "admin";
const ACCOUNT_URL = `${BASE_URL}/accounts`;


export class AdminApi {
    async registerMunicipalityOfficer(params: MunicipalityOfficerDTO) {
        return api.post<MunicipalityOfficerDTO>(`${ACCOUNT_URL}/register`, params);
    }

    async getAllMunicipalityUsers() {
        return api.get<MunicipalityOfficerDTO[]>(`${ACCOUNT_URL}/list`);
    }
    async setRole(params: MunicipalityOfficerDTO){
        return api.put<MunicipalityOfficerDTO>(`${ACCOUNT_URL}/assign`, params)
    }

    async getRoles() {
        return api.get<RoleDTO[]>(`${BASE_URL}/roles/list`);
    }

}
