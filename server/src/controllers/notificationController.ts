import { NotificationRepository } from "../repositories/NotificationRepository";
import { Notification } from "../models/Notification";
import { mapNotificationDAOToDTO } from "../services/mapperService";
import { DataSource } from "typeorm";
import { UserRepository } from "../repositories/UserRepository";

let notificationRepository: NotificationRepository;
let userRepository: UserRepository;

export function initializeNotificationController(dataSource: DataSource) {
    notificationRepository = new NotificationRepository(dataSource);
    userRepository = new UserRepository(dataSource);
}
    
export async function getMyNotifications(username: string) {
    const user = await userRepository.findByUsername(username);
    if (!user) throw new Error("User not found");
    const notifications = await notificationRepository.findByUser(user.id);
    return notifications.map(mapNotificationDAOToDTO);
}

// NON usi markAsRead → invece rimuovi dopo averlo “letto”
export async function deleteNotificationForUser(notificationId: number, username: string) {
    const user = await userRepository.findByUsername(username);
    if (!user) throw new Error("User not found");
    const userId = user.id;
    const notif = await notificationRepository.findById(notificationId);
    if (!notif) throw new Error("Notification not found");

    if (notif.user.id !== userId) {
        throw new Error("Not allowed");
    }

    await notificationRepository.remove(notif);
    return { success: true };
}

export async function markAsReadForUser(notificationId: number, username: string) {
    const user = await userRepository.findByUsername(username);
    if (!user) throw new Error("User not found");

    const notif = await notificationRepository.findById(notificationId);
    if (!notif) throw new Error("Notification not found");

    if (notif.user.id !== user.id) {
        throw new Error("Not allowed");
    }

    const updated = await notificationRepository.markAsRead(notif);
    return mapNotificationDAOToDTO(updated);
}
