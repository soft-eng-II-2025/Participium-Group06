import { AdminApi } from "../api/adminApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MunicipalityOfficerResponseDTO } from "../DTOs/MunicipalityOfficerResponseDTO";
import { RoleResponseDTO } from "../DTOs/RoleResponseDTO";
import {AssignRoleRequestDTO} from "../DTOs/AssignRoleRequestDTO";
import {CreateOfficerRequestDTO} from "../DTOs/CreateOfficerRequestDTO";

const adminApi = new AdminApi();

export function useRegisterMunicipalityOfficer() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (newOfficer: CreateOfficerRequestDTO) =>
            adminApi.registerMunicipalityOfficer(newOfficer),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["officers"] }),
    });
}


export function useGetAllMunicipalityUsers() {
    return useQuery<MunicipalityOfficerResponseDTO[]>({
        queryKey: ["officers"],
        queryFn: () => adminApi.getAllMunicipalityUsers().then(r => r.data),
        staleTime: 5 * 60 * 1000,
    });
}

export function useSetRole() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (updateOfficer: AssignRoleRequestDTO) =>
            adminApi.setRole(updateOfficer),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["officers"] }),
    });
}

// NEW: roles from DB (filter out ADMIN)
export function useGetRoles() {
    return useQuery<RoleResponseDTO[]>({
        queryKey: ["roles"],
        queryFn: () => adminApi.getRoles().then(r => r.data),
        select: (roles) => roles.filter(r => r.title !== "ADMIN"),
        staleTime: 5 * 60 * 1000,
    });
}
