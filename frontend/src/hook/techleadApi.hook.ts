import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TechLeadApi } from "../api/tech-leadApi";

const techLeadApi = new TechLeadApi();

export function useGetAgentsByTechLead(enabled: boolean = true) {
    return useQuery({
        queryKey: ["agentsByTechLead"],
        queryFn: () => techLeadApi.getAgentsByTechLead(),
        enabled,
    });
}

export function useGetTechLeadReports() {

     return useQuery({
        queryKey: ["techLeadReports"],
        queryFn: () => techLeadApi.getTechLeadReports(),
    });
}

export function useAssignTechAgent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params: { reportId: number, officerUsername: string }) =>
            techLeadApi.assignTechAgent(params.reportId, params.officerUsername),
        onSuccess: () => {
            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey: ["techLeadReports"] });
        }
    });
}