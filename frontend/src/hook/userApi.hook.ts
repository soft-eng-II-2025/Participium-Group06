import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { CategoryResponseDTO } from "../DTOs/CategoryResponseDTO";
import {UserApi} from "../api/userApi";
import {CreateReportRequestDTO} from "../DTOs/CreateReportRequestDTO";
import {UpdateUserRequestDTO} from "../DTOs/UpdateUserRequestDTO";

const userApi = new UserApi();

export function useAddReport() {
    return useMutation({
        mutationFn: (report: CreateReportRequestDTO) => userApi.addReport(report),
    });
}

/**
 * Hook per caricare le immagini di un report (ora gestito in locale)
 */
export function useUploadReportImages() {
    return useMutation({
        mutationFn: (images: File[]) => userApi.uploadReportImages(images),
    });
}

export function useReportCategories() {
    return useQuery<CategoryResponseDTO[]>({
        queryKey: ['reportCategories'], // Chiave univoca per la query
        queryFn: userApi.getAllCategories, // Funzione che fa la chiamata API
    });
}


export function useUserProfileUpdate() {
    return useMutation({
        mutationFn: (updatedUser: FormData) =>
            userApi.updateUserProfile(updatedUser),
    });
}