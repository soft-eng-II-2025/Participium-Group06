import {AdminApi} from "../api/adminApi";
import {useMutation, useQuery} from "@tanstack/react-query";
import {ReportDTO} from "../DTOs/ReportDTO";
import {MunicipalityOfficerDTO} from "../DTOs/MunicipalityOfficerDTO";

const adminApi = new AdminApi();

export function useRegisterMunicipalityOfficer(){
    return useMutation({
        mutationFn: (newOfficer: MunicipalityOfficerDTO) => adminApi.registerMunicipalityOfficer(newOfficer),

    })
}

export function useGetAllMunicipalityUsers(){
    return useQuery<MunicipalityOfficerDTO[]>({
        queryKey: ["/list"],
        queryFn: () => adminApi.getAllMunicipalityUsers().then(r => r.data ?? []),
    })
}


export function useSetRole(){
    return useMutation({
        mutationFn: (updateOfficer: MunicipalityOfficerDTO) => adminApi.setRole(updateOfficer)
    })
}