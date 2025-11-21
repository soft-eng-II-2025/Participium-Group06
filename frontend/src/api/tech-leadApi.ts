import api from "./api";
import {ReportResponseDTO} from "../DTOs/ReportResponseDTO";
import { MunicipalityOfficerResponseDTO } from "../DTOs/MunicipalityOfficerResponseDTO";

const BASE_URL = "tech-lead"; 

export class TechLeadApi {
    /*
     * PUT tech-lead/:officerId/report/:reportId
     * Assign a tech agent to a report
     */
    async assignTechAgent(officerId: number, reportId: number): Promise<ReportResponseDTO> {
        const response = await api.put<ReportResponseDTO>(`${BASE_URL}/${officerId}/report/${reportId}`);
        return response.data;
    }
    /*
     * GET tech-lead/:id/agents
     * Returns all the agents under a specific tech lead
     */
    async getAgentsByTechLeadId(techLeadId: number): Promise<MunicipalityOfficerResponseDTO[]> {
        const response = await api.get<MunicipalityOfficerResponseDTO[]>(`${BASE_URL}/${techLeadId}/agents`);
        return response.data;
    }
    /*
     * GET tech-lead/:id/reports/list
     * Returns all reports assigned to agents under a specific tech lead that aren't pending approval
     */
    async getTechLeadReports(techLeadId: number): Promise<ReportResponseDTO[]> {
        const response = await api.get<ReportResponseDTO[]>(`${BASE_URL}/${techLeadId}/reports/list`);
        return response.data;
    }
}

