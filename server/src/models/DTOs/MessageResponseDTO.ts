// src/DTOs/MessageResponseDTO.ts
import { SenderType } from "../SenderType";

export interface MessageResponseDTO {
    reportId: number;
    chatId: number;
    role_label?: string; // Per definire l'officer come ruolo invece che come nome
    username?: string;                               // valorizzato se sender = "USER"
    content: string;
    created_at: Date; // ISO string dal backend (es. "2025-11-21T10:15:00.000Z")
    sender: SenderType;
}
