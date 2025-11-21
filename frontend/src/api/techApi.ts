import api from "./api";
import {ReportResponseDTO} from "../DTOs/ReportResponseDTO";

const BASE_URL = "tech";

export class TechApi {
    /*
     * GET /tech/:id/reports/list
     * Retrieve all reports of a specific tech agent
     */
    async getTechReports(techAgentId: number): Promise<ReportResponseDTO[]> {
        const response = await api.get<ReportResponseDTO[]>(`${BASE_URL}/${techAgentId}/reports/list`);
        return response.data;
    }
}
