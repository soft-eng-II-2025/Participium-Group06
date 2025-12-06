import { MunicipalityOfficer } from "../MunicipalityOfficer";
import { StatusType } from "../StatusType";
import { MunicipalityOfficerResponseDTO } from "./MunicipalityOfficerResponseDTO";
import { UserResponseDTO } from "./UserResponseDTO";
import { CategoryResponseDTO } from "./CategoryResponseDTO";
import { Chat } from "../Chat";
import { ChatResponseDTO } from "./ChatRespondeDTO";

export class ReportResponseDTO {
    id: number | undefined;
    
    longitude!: number;

    latitude!: number;

    title!: string;

    description!: string;

    user!: UserResponseDTO;

    category!: string;

    status!: string;

    explanation!: string;

    officer!: MunicipalityOfficerResponseDTO;

    photos!: string[];

    createdAt!: Date;

    chats!: ChatResponseDTO[];
}
