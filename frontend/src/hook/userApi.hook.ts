// src/hooks/useReport.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReportDTO, CreateReportRequestDTO } from "../DTOs/ReportDTO";
import { UserApi } from "../api/userApi";
import { CategoryResponseDTO } from "../DTOs/CategoryResponseDTO";
import { useQuery } from "@tanstack/react-query";

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