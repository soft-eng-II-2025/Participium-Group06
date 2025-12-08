import {UserResponseDTO} from "./UserResponseDTO";
import { MunicipalityOfficerResponseDTO } from "./MunicipalityOfficerResponseDTO";
import { StatusType } from "./StatusType";
import { ChatResponseDTO } from "./ChatRespondeDTO";

export interface ReportResponseDTO { 
    id: number;
    longitude: number;
    latitude: number;
    title: string;
    description: string;
    user: UserResponseDTO; 
    category: string;
    status: StatusType;
    explanation?: string;
    officer?: MunicipalityOfficerResponseDTO;
    photos: string[]; 
    createdAt: Date;
    updatedAt: Date;
    chats: ChatResponseDTO[];
}   