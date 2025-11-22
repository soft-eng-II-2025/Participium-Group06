// src/services/socketService.ts
import { Server, Socket } from "socket.io";
import { Message } from "../models/Message";
import { Notification } from "../models/Notification";
import { mapMessageDAOToDTO, mapNotificationDAOToDTO } from "./mapperService";

type UserSocketMap = Map<number, Socket>; // userId -> socket
type OfficerSocketMap = Map<number, Socket>; // officerId -> socket

export class SocketService {
    private io: Server;
    private onlineUsers: UserSocketMap = new Map();
    private onlineOfficers: OfficerSocketMap = new Map();

    constructor(io: Server) {
        this.io = io;

        io.on("connection", (socket: Socket) => {
            console.log(`Socket connected: ${socket.id}`);

            // Register user
            socket.on("registerUser", (userId: number) => {
                this.onlineUsers.set(userId, socket);
                console.log(`User ${userId} connected via socket`);
            });

            // Register officer
            socket.on("registerOfficer", (officerId: number) => {
                this.onlineOfficers.set(officerId, socket);
                console.log(`Officer ${officerId} connected via socket`);
            });

            // Cleanup on disconnect
            socket.on("disconnect", () => {
                for (const [userId, s] of this.onlineUsers.entries()) {
                    if (s.id === socket.id) {
                        this.onlineUsers.delete(userId);
                        console.log(`User ${userId} disconnected`);
                        break;
                    }
                }
                for (const [officerId, s] of this.onlineOfficers.entries()) {
                    if (s.id === socket.id) {
                        this.onlineOfficers.delete(officerId);
                        console.log(`Officer ${officerId} disconnected`);
                        break;
                    }
                }
            });
        });
    }

    /**
     * Emit a new message to a user if online
     */
    sendMessageToUser(userId: number, message: Message) {
        const socket = this.onlineUsers.get(userId);
        if (socket) {
            socket.emit("newMessage", mapMessageDAOToDTO(message));
        }
    }

    /**
     * Emit a new notification to a user if online
     */
    sendNotificationToUser(userId: number, notification: Notification) {
        const socket = this.onlineUsers.get(userId);
        if (socket) {
            socket.emit("newNotification", mapNotificationDAOToDTO(notification));
        }
    }

    /**
     * Emit a new message to an officer if online
     */
    sendMessageToOfficer(officerId: number, message: Message) {
        const socket = this.onlineOfficers.get(officerId);
        if (socket) {
            socket.emit("newMessage", mapMessageDAOToDTO(message));
        }
    }
}
