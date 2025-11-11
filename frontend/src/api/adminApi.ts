import api from "./api";
import {ReportDTO} from "../DTOs/ReportDTO";
import {MunicipalityOfficerDTO} from "../DTOs/MunicipalityOfficerDTO";
import { RoleDTO } from "../DTOs/RoleDTO";


const BASE_URL = "admin/accounts";

export class AdminApi {
    async registerMunicipalityOfficer(params: MunicipalityOfficerDTO) {
        return api.post<MunicipalityOfficerDTO>(`${BASE_URL}/register`, params);
    }

    async getAllMunicipalityUsers() {
        return api.get<MunicipalityOfficerDTO[]>(`${BASE_URL}/list`);
    }
    async setRole(params: MunicipalityOfficerDTO){
        return api.put<MunicipalityOfficerDTO>(`${BASE_URL}/assign`, params)
    }

    async getRoles() {
        return api.get<RoleDTO[]>(`${BASE_URL}/roles/list`);
    }

}
