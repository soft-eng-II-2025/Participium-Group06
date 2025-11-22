// src/controllers/messageController.ts
import { MessageRepository } from "../repositories/MessageRepository";
import { NotificationRepository } from "../repositories/NotificationRepository";
import { Message } from "../models/Message";
import { Notification } from "../models/Notification";
import { SocketService } from "../services/socketService";
import { NotificationType } from "../models/NotificationType";
import { mapMessageDAOToDTO } from "../services/mapperService";
import { User } from "../models/User";
import { MunicipalityOfficer } from "../models/MunicipalityOfficer";

let messageRepository: MessageRepository;
let notificationRepository: NotificationRepository;
let socketService: SocketService;

/**
 * Initialize repositories and socket service
 */
export function initializeMessageController(
    msgRepo: MessageRepository,
    notifRepo: NotificationRepository,
    socketSrv: SocketService
) {
    messageRepository = msgRepo;
    notificationRepository = notifRepo;
    socketService = socketSrv;
}

/**
 * Send a new message
 * - senderType: "USER" or "OFFICER"
 * - recipientId: the other party’s ID (User.id or Officer.id)
 */
export async function sendMessage(
    content: string,
    reportId: number,
    senderType: "USER" | "OFFICER",
    senderId: number,
    recipientId?: number
) {
    // Create message entity
    const message = new Message();
    message.content = content;
    message.report_id = reportId;
    message.sender = senderType;

    if (senderType === "USER") {
        const user = new User();
        user.id = senderId;
        message.user = user;
    } else {
        const officer = new MunicipalityOfficer();
        officer.id = senderId;
        message.municipality_officer = officer;
    }

    const savedMessage = await messageRepository.add(message);

    // Sender is OFFICER → create notification for user
    if (senderType === "OFFICER" && recipientId) {
        const user = new User();
        user.id = recipientId;

        const notification = new Notification();
        notification.user = user;
        notification.content = "New message from officer";
        notification.type = NotificationType.NewMessage;
        notification.is_read = false;

        const savedNotification = await notificationRepository.add(notification);

        // Emit via socket
        socketService.sendMessageToUser(recipientId, savedMessage);
        socketService.sendNotificationToUser(recipientId, savedNotification);
    }

    // Sender is USER → send to officer only, no notification
    if (senderType === "USER" && recipientId) {
        socketService.sendMessageToOfficer(recipientId, savedMessage);
    }

    return mapMessageDAOToDTO(savedMessage);
}

/**
 * Get all messages for a report
 */
export async function getMessagesByReport(reportId: number) {
    if (!messageRepository) throw new Error("MessageRepository not initialized");

    const messages = await messageRepository.findByReport(reportId);
    return messages.map(mapMessageDAOToDTO);
}
