import { NotificationRepository } from "../repositories/NotificationRepository";
import { Notification } from "../models/Notification";
import { mapNotificationDAOToDTO } from "../services/mapperService";
import { DataSource } from "typeorm";

let notificationRepository: NotificationRepository;

export function initializeNotificationController(dataSource: DataSource) {
    notificationRepository = new NotificationRepository(dataSource);
}

export async function getMyNotifications(userId: number) {
    const notifications = await notificationRepository.findByUser(userId);
    return notifications.map(mapNotificationDAOToDTO);
}

// NON usi markAsRead → invece rimuovi dopo averlo “letto”
export async function deleteNotificationForUser(notificationId: number, userId: number) {
    const notif = await notificationRepository.findById(notificationId);
    if (!notif) throw new Error("Notification not found");

    if (notif.user.id !== userId) {
        throw new Error("Not allowed");
    }

    await notificationRepository.remove(notif);
    return { success: true };
}
