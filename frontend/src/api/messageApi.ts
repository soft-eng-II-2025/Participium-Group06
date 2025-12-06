// frontend/src/api/messageApi.ts
import api from "./api";
import { MessageResponseDTO } from "../DTOs/MessageResponseDTO";

export interface CreateMessageDTO {
  chat_id: number;
  content: string;
  sender: "USER" | "OFFICER" | "LEAD" | "EXTERNAL";
  //created_at?: string;
}

const BASE_URL = "messages";

export class MessageApi {
  async sendMessage(dto: CreateMessageDTO): Promise<MessageResponseDTO> {
    const response = await api.post<MessageResponseDTO>(
      `${BASE_URL}/${dto.chat_id}`, // :reportId nei params
      dto                              // dto nel body
    );
    return response.data;
  }

  async getMessagesByReportOfficerUser(reportId: number): Promise<MessageResponseDTO[]> {
    const response = await api.get<MessageResponseDTO[]>(`${BASE_URL}/${reportId}/officer-user`);
    return response.data;
  }

  async getMessagesByReportLeadExternal(reportId: number): Promise<MessageResponseDTO[]> {
    const response = await api.get<MessageResponseDTO[]>(`${BASE_URL}/${reportId}/lead-external`);
    return response.data;
  }
}

export const messageApi = new MessageApi();