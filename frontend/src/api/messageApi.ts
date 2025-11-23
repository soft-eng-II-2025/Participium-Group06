import api from "./api";
import { MessageDTO } from "../DTOs/MessageDTO";

const BASE_URL = "messages";

export interface SendMessageRequestDTO {
    content: string;
    reportId: number;
    senderType: "USER" | "OFFICER";
    recipientId?: number;
}


export class MessageApi {
    async sendMessage(payload: SendMessageRequestDTO): Promise<MessageDTO> {
        const response = await api.post<MessageDTO>(`${BASE_URL}`, {
            content: payload.content,
            reportId: payload.reportId,
            senderType: payload.senderType,
            recipientId: payload.recipientId,
        });
        return response.data;
    }

    async getMessagesByReport(reportId: number): Promise<MessageDTO[]> {
        const response = await api.get<MessageDTO[]>(`${BASE_URL}/${reportId}`);
        return response.data;
    }
}
