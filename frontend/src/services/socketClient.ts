// frontend: src/services/socketClient.ts
import { io, Socket } from "socket.io-client";
import { MessageResponseDTO } from "../DTOs/MessageDTO";

let socket: Socket | null = null;

interface InitSocketOptions {
  baseUrl?: string;
  userId?: number;
  officerId?: number;
}

export function initSocketClient({
  baseUrl = "http://localhost:3000",
  userId,
  officerId,
}: InitSocketOptions = {}) {
  if (socket) return socket;

  socket = io(baseUrl, {
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
    if (userId) socket?.emit("registerUser", userId);
    if (officerId) socket?.emit("registerOfficer", officerId);
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