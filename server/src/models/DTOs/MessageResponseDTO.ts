// src/DTOs/MessageResponseDTO.ts


export interface MessageResponseDTO {
    role_label?: string; // Per definire l'officer come ruolo invece che come nome
    username?: string;                               // valorizzato se sender = "USER"
    content: string;
    created_at: Date; // ISO string dal backend (es. "2025-11-21T10:15:00.000Z")
    sender: "USER" | "OFFICER";
}
