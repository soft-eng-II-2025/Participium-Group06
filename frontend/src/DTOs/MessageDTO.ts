// src/DTOs/MessageDTO.ts

import { MunicipalityOfficerResponseDTO } from "./MunicipalityOfficerResponseDTO";
import { UserResponseDTO } from "./UserResponseDTO";

export interface MessageDTO {
    municipality_officer?: MunicipalityOfficerResponseDTO; // valorizzato se sender = "OFFICER"
    user?: UserResponseDTO;                               // valorizzato se sender = "USER"
    content: string;
    created_at: string; // ISO string dal backend (es. "2025-11-21T10:15:00.000Z")
    sender: "USER" | "OFFICER";
}
