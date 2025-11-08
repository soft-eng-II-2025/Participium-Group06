import axios from "axios";
import {ReportDTO} from "../DTOs/ReportDTO";
import {MunicipalityOfficerDTO} from "../DTOs/MunicipalityOfficerDTO";


const BASE_URL = "/api/admin/accounts";

export class AdminApi {

    async registerMunicipalityOfficer(params: MunicipalityOfficerDTO) {
        return axios.post <MunicipalityOfficerDTO>(`${BASE_URL}/register`, params);
    }
    async getAllMunicipalityUsers() {
        return axios.get <MunicipalityOfficerDTO>(`${BASE_URL}/list`);
    }
    async setRole(params: MunicipalityOfficerDTO){
        return axios.put<MunicipalityOfficerDTO>(`${BASE_URL}/assign`, params)
    }

}