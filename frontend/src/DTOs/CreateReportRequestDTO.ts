import {UserResponseDTO} from "./UserResponseDTO";


export interface CreateReportRequestDTO {
    longitude: number;
    latitude: number;
    title: string;
    description: string;
    userId?: number;
    categoryId: number;
    photos: string[];
}

export interface ReportDTO { // Questa è la tua interfaccia esistente, per i dati completi
    longitude: number;
    latitude: number;
    title: string;
    description: string;
    user: UserResponseDTO; // Questo sarà popolato dal backend
    categoryId: number;
    photos: string[]; // Questi saranno URL/ID delle foto caricate
}



