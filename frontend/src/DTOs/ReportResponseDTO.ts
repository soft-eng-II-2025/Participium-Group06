import { MunicipalityOfficerResponseDTO } from "./MunicipalityOfficerResponseDTO";
import { UserResponseDTO } from "./UserResponseDTO";
import { ChatResponseDTO } from "./ChatRespondeDTO";
import { StatusType } from "./StatusType";

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
    leadOfficer?: MunicipalityOfficerResponseDTO;
    anonymous: boolean;
}   