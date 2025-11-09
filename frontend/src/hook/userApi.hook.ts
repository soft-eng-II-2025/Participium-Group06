import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ReportDTO } from "../DTOs/ReportDTO";
import {UserApi} from "../api/userApi";

const userApi = new UserApi();
/**
 * Hook per aggiungere un nuovo report
 */
export function useAddReport() {
    return useMutation({
        mutationFn: (report: ReportDTO) => userApi.addReport(report),
    });
}