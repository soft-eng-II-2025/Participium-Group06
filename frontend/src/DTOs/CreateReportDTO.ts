import {UserResponseDTO} from "./UserResponseDTO";
import { MunicipalityOfficerResponseDTO } from "./MunicipalityOfficerResponseDTO";
import { StatusType } from "./StatusType";

export interface CreateReportDTO { // Questa è la tua interfaccia esistente, per i dati completi
    longitude: number;
    latitude: number;
    title: string;
    description: string;
    user: UserResponseDTO; // Questo sarà popolato dal backend
    categoryId: number;
    status: StatusType;
    explanation?: string;
    officer?: MunicipalityOfficerResponseDTO;
    photos: string[]; // Questi saranno URL/ID delle foto caricate
}   