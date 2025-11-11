import api from "./api";
import {ReportDTO} from "../DTOs/ReportDTO";

const BASE_URL = "users";

export class UserApi {

    async addReport(params: ReportDTO) {
        return api.post<ReportDTO>(`${BASE_URL}/reports`, params);
    }

}
