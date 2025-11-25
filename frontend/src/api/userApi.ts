// src/api/userApi.ts

import api from "./api";
import { CategoryResponseDTO } from "../DTOs/CategoryResponseDTO";
import {CreateReportRequestDTO} from "../DTOs/CreateReportRequestDTO";
import {CreateReportDTO} from "../DTOs/CreateReportDTO";
import {UpdateUserRequestDTO} from "../DTOs/UpdateUserRequestDTO";
import {UserResponseDTO} from "../DTOs/UserResponseDTO";

const BASE_URL = "users"; // Base URL per le tue API

export class UserApi {
    async addReport(params: CreateReportRequestDTO) {
        return api.post<CreateReportDTO>(`${BASE_URL}/reports`, params);
    }

    // Funzione per l'upload delle immagini (ora per endpoint locale)
    async uploadReportImages(images: File[]): Promise<string[]> {
        const formData = new FormData();
        images.forEach((file) => {
            formData.append("images", file); // 'images' deve corrispondere al campo in multer.array('images', ...)
        });

        // L'URL punta all'endpoint locale che gestisce l'upload
        // Assumendo che la tua API sia montata su /api
        const response = await api.post<{ urls: string[] }>(`${BASE_URL}/reports/images/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data', // Multer si aspetta questo
            },
        });
        return response.data.urls; // Assumiamo che il backend risponda con un oggetto { urls: string[] }
    }

    async getAllCategories(): Promise<CategoryResponseDTO[]> {
        const response = await api.get<CategoryResponseDTO[]>(`${BASE_URL}/reports/categories`);
        return response.data;
    }

    async updateUserProfile(payload: UpdateUserRequestDTO): Promise<UserResponseDTO> {
        const response = await api.put<UserResponseDTO>(`${BASE_URL}/me`, payload);
        return response.data;
    }
}