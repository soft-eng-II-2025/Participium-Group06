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
import { ChatRepository } from "../repositories/ChatRepository";
import { Chat } from "../models/Chat";
import { ChatType } from "../models/ChatType";
import { Report } from "../models/Report";


let messageRepository: MessageRepository;
let notificationRepository: NotificationRepository;
let socketService: SocketService;
let reportRepository: ReportRepository;
let chatRepository: ChatRepository;

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
    chatRepository = new ChatRepository(dataSource);
}


export async function createChatOfficerUser(report: Report): Promise<Chat> {
    return await chatRepository.addReportToChatOfficerUser(report);
}

export async function createChatLeadExternal(report: Report): Promise<Chat> {
    return await chatRepository.addReportToLeadExternalUser(report);
}

/**
 * Send a new message
 * - senderType: "USER" or "OFFICER"
 * - recipientId: the other party’s ID (User.id or Officer.id)
 */
export async function sendMessage(
    chatId: number,         // comes from route params
    dto: CreateMessageDTO     // contains content + sender only
) {
    const { sender, content } = dto;
    // 1️⃣ Fetch report to get user + officer
    const chat = await chatRepository.findById(chatId);
    if (!chat) throw new Error("Chat not found.");

    // 2️⃣ Create message
    const message = new Message();
    message.chat = chat;
    message.content = content;
    message.sender = sender;
    message.created_at = new Date(); // set here, not in DTO    

    const savedMessage = await messageRepository.add(message);
    // 3️⃣ Notifications
    if (sender === "OFFICER") {
        const notif = new Notification();
        const user = chat.report.user as User;
        notif.user = user;
        notif.content = "New message from officer";
        notif.type = NotificationType.NewMessage;
        notif.is_read = false;
        const savedNotif = await notificationRepository.add(notif);

        socketService.sendMessageToUser(user.id, savedMessage);
        socketService.sendNotificationToUser(user.id, savedNotif);
    } else if (sender === "USER") {
        const officer = chat.report.officer as MunicipalityOfficer;
        socketService.sendMessageToOfficer(officer.id, savedMessage);
    } else if (sender === "LEAD") {
        
        if (chat.type === "OFFICER_USER") {
            const notif = new Notification();
            const user = chat.report.user;
            notif.user = user;
            notif.content = "New message from officer"; // Same content as OFFICER sender
            notif.type = NotificationType.NewMessage;
            notif.is_read = false;
            const savedNotif = await notificationRepository.add(notif);

            // Send notification to the report user
            socketService.sendMessageToUser(user.id, savedMessage);
            socketService.sendNotificationToUser(user.id, savedNotif);
        } else {
            // It's a LEAD_EXTERNAL chat, no user notification needed
            const externalOfficer = chat.report.officer as MunicipalityOfficer;
            socketService.sendMessageToOfficer(externalOfficer.id, savedMessage);
        }
    } else {
        const leadOfficer = chat.report.leadOfficer as MunicipalityOfficer;
        socketService.sendMessageToOfficer(leadOfficer.id, savedMessage);
    }

    return mapMessageDAOToDTO(savedMessage);
}


/**
 * Get all messages for a report
 */
export async function getMessagesByReport(reportId: number, chatType: ChatType) {
    if (!messageRepository) throw new Error("MessageRepository not initialized");

    const chat = await chatRepository.findByReportIdAndType(reportId, chatType);
    if (!chat) throw new Error("Chat not found for the given report and type.");
    const messages = await messageRepository.findByChatId(chat.id);
    //const messages = await messageRepository.findByReport(reportId);
    return messages.map(mapMessageDAOToDTO);
}
