import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ReportResponseDTO } from "../DTOs/ReportResponseDTO";
import {UserApi} from "../api/userApi";

const userApi = new UserApi();
/**
 * Hook per aggiungere un nuovo report
 */
export function useAddReport() {
    return useMutation({
        mutationFn: (report: ReportResponseDTO) => userApi.addReport(report),
    });
}