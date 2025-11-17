import { MunicipalityOfficerResponseDTO } from "./MunicipalityOfficerResponseDTO";

// Interfaccia per i dati che inviamo per creare un nuovo report
export interface CreateReportRequestDTO {
    longitude: number;
    latitude: number;
    title: string;
    description: string;
    userId?: number; // Se il backend si aspetta l'ID dell'utente
    categoryId: number;
    officer?: MunicipalityOfficerResponseDTO;
    photos: string[]; // Array di URL/ID delle foto
}