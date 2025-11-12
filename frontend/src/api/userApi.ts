import axios from "axios";
import {ReportResponseDTO} from "../DTOs/ReportResponseDTO";
import {CreateReportRequestDTO} from "../DTOs/CreateReportRequestDTO";


const BASE_URL = "/api/users";

export class UserApi {

    async addReport(params: CreateReportRequestDTO) {
        console.log(`addReport ${params} parte la richiesta`)
        return axios.post <ReportResponseDTO>(`${BASE_URL}/reports`, params);
    }

}
