// src/api/officerApi.ts

import api from "./api";
import { ReportDTO } from "../DTOs/ReportDTO";
import { UpdateStatusReportDTO } from "../DTOs/UpdateStatusReportDTO";

const BASE_URL = "reports"; // mappato su /api/reports

export class OfficerApi {
    /*
     * GET /reports/list
     * Retrieve all reports
     */

    async getAllReports(): Promise<ReportDTO[]> {
        const response = await api.get<ReportDTO[]>(`${BASE_URL}/list`);
        return response.data;
    }

    /*
     * PUT /reports/:id/status
     * Update the status of a report
     */

    async updateReportStatus(
        reportId: number,
        payload: UpdateStatusReportDTO
    ): Promise<ReportDTO> {
        const response = await api.put<ReportDTO>(
            `${BASE_URL}/${reportId}/status`,
            payload
        );
        return response.data;
    }
}
