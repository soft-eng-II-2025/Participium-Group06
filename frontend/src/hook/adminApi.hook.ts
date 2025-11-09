import { AdminApi } from "../api/adminApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MunicipalityOfficerDTO } from "../DTOs/MunicipalityOfficerDTO";
import { RoleDTO } from "../DTOs/RoleDTO";

const adminApi = new AdminApi();

export function useRegisterMunicipalityOfficer() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (newOfficer: MunicipalityOfficerDTO) =>
            adminApi.registerMunicipalityOfficer(newOfficer),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["officers"] }),
    });
}

export function useGetAllMunicipalityUsers(){
    return useQuery<MunicipalityOfficerDTO[]>({
        queryKey: ["/list"],
        queryFn: () => adminApi.getAllMunicipalityUsers().then(r => r.data ?? []),
    })
}


export function useSetRole() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (updateOfficer: MunicipalityOfficerDTO) =>
            adminApi.setRole(updateOfficer),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["officers"] }),
    });
}

export function useGetRoles() {
    return useQuery<RoleDTO[]>({
        queryKey: ["roles"],
        queryFn: () => adminApi.getRoles().then(r => r.data),
        staleTime: 5 * 60 * 1000,
    });
}
