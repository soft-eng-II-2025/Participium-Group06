import axios from "axios";
import { MunicipalityOfficerResponseDTO } from "../DTOs/MunicipalityOfficerResponseDTO";
import { RoleResponseDTO } from "../DTOs/RoleResponseDTO";
import {CreateUserRequestDTO} from "../DTOs/CreateUserRequestDTO";
import {AssignRoleRequestDTO} from "../DTOs/AssignRoleRequestDTO";

const ADMIN_BASE = "/api/admin";
const ACCOUNTS_BASE = `${ADMIN_BASE}/accounts`;

export class AdminApi {
    async registerMunicipalityOfficer(params: CreateUserRequestDTO) {
        return axios.post<MunicipalityOfficerResponseDTO>(`${ACCOUNTS_BASE}/register`, params);
    }

    async getAllMunicipalityUsers() {
        return axios.get <MunicipalityOfficerResponseDTO[]>(`${ACCOUNTS_BASE}/list`);
    }

    async setRole(params: AssignRoleRequestDTO) {
        return axios.put<MunicipalityOfficerResponseDTO>(`${ACCOUNTS_BASE}/assign`, params);
    }

    async getRoles() {
        return axios.get<RoleResponseDTO[]>(`${ADMIN_BASE}/roles/list`);
    }
}
