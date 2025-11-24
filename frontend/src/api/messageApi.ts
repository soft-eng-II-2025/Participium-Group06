import api from "./api";
import { MessageResponseDTO } from "../DTOs/MessageResponseDTO";
import { SendMessageRequestDTO } from "../DTOs/SendMessageRequestDTO";

const BASE_URL = "messages";


export class MessageApi {
    async sendMessage(payload: SendMessageRequestDTO, reportId: number): Promise<MessageResponseDTO> {
        const response = await api.post<MessageResponseDTO>(`${BASE_URL}/${reportId}`, {
            content: payload.content,
            senderType: payload.senderType
        });
        return response.data;
    }

    async getMessagesByReport(reportId: number): Promise<MessageResponseDTO[]> {
        const response = await api.get<MessageResponseDTO[]>(`${BASE_URL}/${reportId}`);
        return response.data;
    }
}
