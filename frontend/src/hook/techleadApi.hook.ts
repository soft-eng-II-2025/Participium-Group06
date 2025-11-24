import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TechLeadApi } from "../api/tech-leadApi";

const techLeadApi = new TechLeadApi();

export function useGetAgentsByTechLead() {

     return useQuery({
        queryKey: ["agentsByTechLead"],
        queryFn: () => techLeadApi.getAgentsByTechLead(),
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
        mutationFn: (params: { officerUsername: string; reportId: number }) =>
            techLeadApi.assignTechAgent(params.reportId),
        onSuccess: () => {
            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey: ["techLeadReports"] });
        }
    });
}