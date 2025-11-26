import {UserResponseDTO} from "./UserResponseDTO";
import { MunicipalityOfficerResponseDTO } from "./MunicipalityOfficerResponseDTO";
import { StatusType } from "./StatusType";

export interface ReportResponseDTO { 
    id: number;
    longitude: number;
    latitude: number;
    title: string;
    description: string;
    user: UserResponseDTO; 
    category: number;
    status: StatusType;
    explanation?: string;
    officer?: MunicipalityOfficerResponseDTO;
    photos: string[]; 
    createdAt: Date;
}   