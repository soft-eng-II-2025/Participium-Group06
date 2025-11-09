import axios from "axios";
import { MunicipalityOfficerDTO } from "../DTOs/MunicipalityOfficerDTO";
import { RoleDTO } from "../DTOs/RoleDTO";

const ADMIN_BASE = "/api/admin";
const ACCOUNTS_BASE = `${ADMIN_BASE}/accounts`;

export class AdminApi {
    async registerMunicipalityOfficer(params: MunicipalityOfficerDTO) {
        return axios.post<MunicipalityOfficerDTO>(`${ACCOUNTS_BASE}/register`, params);
    }

    async getAllMunicipalityUsers() {
        return axios.get<MunicipalityOfficerDTO[]>(`${ACCOUNTS_BASE}/list`);
    }

    async setRole(params: MunicipalityOfficerDTO) {
        return axios.put<MunicipalityOfficerDTO>(`${ACCOUNTS_BASE}/assign`, params);
    }

    async getRoles() {
        return axios.get<RoleDTO[]>(`${ADMIN_BASE}/roles/list`);
    }
}
