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
import { DataSource } from "typeorm";
import { Server as SocketIoServer } from "socket.io";
import { report } from "process";
import { ReportRepository } from "../repositories/ReportRepository";
import { CreateMessageDTO } from "../models/DTOs/CreateMessageDTO";


let messageRepository: MessageRepository;
let notificationRepository: NotificationRepository;
let socketService: SocketService;
let reportRepository: ReportRepository;

/**
 * Initialize repositories and socket service
 */
/*export function initializeMessageController(
    msgRepo: MessageRepository,
    notifRepo: NotificationRepository,
    socketSrv: SocketService
) {
    messageRepository = msgRepo;
    notificationRepository = notifRepo;
    socketService = socketSrv;
}*/

export function initializeMessageRepositories(
    dataSource: DataSource,
    io: SocketIoServer
) {
    messageRepository = new MessageRepository(dataSource);
    reportRepository = new ReportRepository(dataSource);
    notificationRepository = new NotificationRepository(dataSource);
    socketService = new SocketService(io); // Assumes SocketService can be instantiated without parameters
}

/**
 * Send a new message
 * - senderType: "USER" or "OFFICER"
 * - recipientId: the other party’s ID (User.id or Officer.id)
 */
export async function sendMessage(
    reportId: number,         // comes from route params
    dto: CreateMessageDTO     // contains content + sender only
) {
    const { sender, content } = dto;

    // 1️⃣ Fetch report to get user + officer
    const report = await reportRepository.findById(reportId);
    if (!report) throw new Error("Report not found.");

    const user = report.user;
    const officer = report.officer;

    if (!user) throw new Error("Report has no user assigned.");
    if (!officer) throw new Error("Report has no officer assigned.");

    // 2️⃣ Create message
    const message = new Message();
    message.report_id = reportId;
    message.content = content;
    message.sender = sender;
    message.created_at = new Date(); // set here, not in DTO

    if (sender === "USER") {
        message.user = user;
        message.municipality_officer = officer;
    } else {
        message.user = user;
        message.municipality_officer = officer;
    }

    const savedMessage = await messageRepository.add(message);

    // 3️⃣ Notifications
    if (sender === "OFFICER") {
        const notif = new Notification();
        notif.user = user;
        notif.content = "New message from officer";
        notif.type = NotificationType.NewMessage;
        notif.is_read = false;

        const savedNotif = await notificationRepository.add(notif);

        socketService.sendMessageToUser(user.id, savedMessage);
        socketService.sendNotificationToUser(user.id, savedNotif);
    }

    if (sender === "USER") {
        socketService.sendMessageToOfficer(officer.id, savedMessage);
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
