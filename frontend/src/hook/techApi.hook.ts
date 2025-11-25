import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TechApi } from "../api/techApi";

const techApi = new TechApi();
export function useGetTechReports() {
    return useQuery({
        queryKey: ["techReports"],
        queryFn: () => techApi.getTechReports(),
    });
}