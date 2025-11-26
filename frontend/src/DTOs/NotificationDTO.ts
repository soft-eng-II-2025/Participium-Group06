// src/DTOs/NotificationDTO.ts

import { UserResponseDTO } from "./UserResponseDTO";
import { NotificationType } from "./NotificationType";

export interface NotificationDTO {
    user: UserResponseDTO;
    content: string;
    type: NotificationType;
    is_read: boolean;
    created_at: string; // ISO string dal backend
}
