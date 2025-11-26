// frontend/src/services/socketClient.ts
import { io, Socket } from "socket.io-client";
import { MessageResponseDTO } from "../DTOs/MessageResponseDTO";
import { NotificationDTO } from "../DTOs/NotificationDTO";

let socket: Socket | null = null;

interface InitSocketOptions {
  baseUrl?: string;
  UserUsername?: string;
  OfficerUsername?: string;
}

export function initSocketClient({
  baseUrl = "http://localhost:3000",
  UserUsername,
  OfficerUsername,
}: InitSocketOptions = {}) {
  if (socket) return socket;

  socket = io(baseUrl, {
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
    if (UserUsername) socket?.emit("registerUser", UserUsername);
    if (OfficerUsername) socket?.emit("registerOfficer", OfficerUsername);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  return socket;
}

export function subscribeToNewMessages(cb: (m: MessageResponseDTO) => void) {
  if (!socket) return;
  socket.on("newMessage", cb);
}

export function unsubscribeFromNewMessages(cb: (m: MessageResponseDTO) => void) {
  if (!socket) return;
  socket.off("newMessage", cb);
}

export function subscribeToNewNotifications(
  cb: (n: NotificationDTO) => void
) {
  socket?.on("newNotification", cb);
}

export function unsubscribeFromNewNotifications(
  cb: (n: NotificationDTO) => void
) {
  socket?.off("newNotification", cb);
}

export function getSocket() {
  return socket;
}
