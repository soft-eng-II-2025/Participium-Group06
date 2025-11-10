import axios from "axios";
import {ReportDTO} from "../DTOs/ReportDTO";


const BASE_URL = "/api/users";

export class UserApi {

    async addReport(params: ReportDTO) {
        console.log(`addReport ${params} parte la richiesta`)
        return axios.post <ReportDTO>(`${BASE_URL}/reports`, params);
    }

}
