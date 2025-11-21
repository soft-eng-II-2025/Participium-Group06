// src/api/reportsApi.ts

import api from "./api";
import { UpdateStatusReportDTO } from "../DTOs/UpdateStatusReportDTO";
import {ReportResponseDTO} from "../DTOs/ReportResponseDTO";

const BASE_URL = "reports"; // mappato su /api/reports

export class ReportsApi {
    /*
     * GET /reports/list
     * Retrieve all reports
     */

    async getAllReports(): Promise<ReportResponseDTO[]> {
        const response = await api.get<ReportResponseDTO[]>(`${BASE_URL}/list`);
        return response.data;
    }
    /* * GET /reports/list * Retrieve all approved reports */
     async getApprovedReports(): Promise<ReportResponseDTO[]> {
        const response = await api.get<ReportResponseDTO[]>(`${BASE_URL}/list/accepted`); 
        return response.data; }

    /*
     * PUT /reports/:id/status
     * Update the status of a report
     */

    async updateReportStatus(
        reportId: number,
        payload: UpdateStatusReportDTO
    ): Promise<ReportResponseDTO> {
        const response = await api.put<ReportResponseDTO>(
            `${BASE_URL}/${reportId}/status`,
            payload
        );
        return response.data;
    }
}
