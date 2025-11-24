import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CategoryResponseDTO } from "../DTOs/CategoryResponseDTO";
import {ReportsApi} from "../api/reportsApi";
import {CreateReportRequestDTO} from "../DTOs/CreateReportRequestDTO";
import { UpdateStatusReportDTO } from "../DTOs/UpdateStatusReportDTO";

const reportsApi = new ReportsApi();

export function useGetAllReports() {
    return useQuery({
        queryKey: ["reports"],
        queryFn: () => reportsApi.getAllReports(),
    });
}

export function useUpdateReportStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ reportId, payload }: { reportId: number; payload: UpdateStatusReportDTO }) =>
            reportsApi.updateReportStatus(reportId, payload),
        onSuccess: () => {
            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey: ["reports", "techReports"] });
        },
    });
}