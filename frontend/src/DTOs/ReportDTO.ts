// src/DTOs/ReportDTO.ts
import { UserDTO } from "./UserDTO"; // Manteniamo questo per la definizione completa se serve altrove

export interface ReportDTO { // Questa è la tua interfaccia esistente, per i dati completi
    longitude: number;
    latitude: number;
    title: string;
    description: string;
    user: UserDTO; // Questo sarà popolato dal backend
    categoryId: number;
    photos: string[]; // Questi saranno URL/ID delle foto caricate
}

// Interfaccia per i dati che inviamo per creare un nuovo report
export interface CreateReportRequestDTO {
    longitude: number;
    latitude: number;
    title: string;
    description: string;
    // userId?: number; // Se il backend si aspetta l'ID dell'utente
    categoryId: number;
    photos: string[]; // Array di URL/ID delle foto
}