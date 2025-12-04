// frontend/src/hook/messagesApi.hook.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { messageApi, CreateMessageDTO } from "../api/messageApi";
import { MessageResponseDTO } from "../DTOs/MessageResponseDTO";

export function useMessagesByReportOfficerUser(reportId: number, enabled = true) {
  return useQuery<MessageResponseDTO[]>({
    queryKey: ["messages", reportId],
    queryFn: () => messageApi.getMessagesByReportOfficerUser(reportId),
    enabled: !!reportId && enabled,
  });
}

export function useMessagesByReportLeadExternal(reportId: number, enabled = true) {
  return useQuery<MessageResponseDTO[]>({
    queryKey: ["messages", reportId],
    queryFn: () => messageApi.getMessagesByReportLeadExternal(reportId),
    enabled: !!reportId && enabled,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateMessageDTO) => messageApi.sendMessage(dto),
    onSuccess: (newMessage, dto) => {
      qc.setQueryData<MessageResponseDTO[]>(
        ["messages", dto.chat_id],
        (old) => (old ? [...old, newMessage] : [newMessage])
      );
    },
  });
}