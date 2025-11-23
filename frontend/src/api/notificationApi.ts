// src/api/notificationApi.ts

import api from "./api";
import { NotificationDTO } from "../DTOs/NotificationDTO";

const BASE_URL = "notifications";

export class NotificationApi {
    /**
     * GET /api/notifications
     * Restituisce tutte le notifiche dell'utente autenticato.
     */
    async getMyNotifications(): Promise<NotificationDTO[]> {
        const response = await api.get<NotificationDTO[]>(`${BASE_URL}`);
        return response.data;
    }

    /**
     * DELETE /api/notifications/:id
     * Rimuove una notifica (equivale a "segna come letta", visto che non usate markAsRead).
     */
    async deleteNotification(notificationId: number): Promise<void> {
        await api.delete(`${BASE_URL}/${notificationId}`);
    }
}
