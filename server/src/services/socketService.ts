// src/services/socketService.ts
import { Server, Socket } from "socket.io";
import { Message } from "../models/Message";
import { Notification } from "../models/Notification";
import { mapMessageDAOToDTO, mapNotificationDAOToDTO } from "./mapperService";
import { getUserIdByUsername } from "../controllers/userController";
import { getOfficerIdByUsername } from "../controllers/adminController";

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
            socket.on("registerUser", (UserUsername: string) => {
                // console.log("Registering user socket for", UserUsername);
                getUserIdByUsername(UserUsername).then((userId) => {
                    this.onlineUsers.set(userId, socket);
                    console.log(`User ${UserUsername} (ID: ${userId}) connected via socket`);
                }).catch((err) => {
                    console.error(`Failed to register user ${UserUsername}:`, err);
                });
            });

            // Register officer
            socket.on("registerOfficer", (OfficerUsername: string) => {
                console.log("Registering officer socket for", OfficerUsername);
                getOfficerIdByUsername(OfficerUsername).then((officerId) => {
                    this.onlineOfficers.set(officerId, socket);
                    console.log(`Officer ${OfficerUsername} (ID: ${officerId}) connected via socket`);
                }).catch((err) => {
                    console.error(`Failed to register officer ${OfficerUsername}:`, err);
                });
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
        console.log("Sending notification to user", userId);
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
