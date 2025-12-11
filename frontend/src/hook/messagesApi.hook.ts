// frontend/src/hook/messagesApi.hook.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { messageApi, CreateMessageDTO } from "../api/messageApi";
import { MessageResponseDTO } from "../DTOs/MessageResponseDTO";

export function useMessagesByReportOfficerUser(reportId: number, enabled = true) {
  return useQuery<MessageResponseDTO[]>({
    // use a distinct key for officer-user chat so it doesn't collide with lead-external
    queryKey: ["messages", "officer", reportId],
    queryFn: () => messageApi.getMessagesByReportOfficerUser(reportId),
    enabled: !!reportId && enabled,
  });
}

export function useMessagesByReportLeadExternal(reportId: number, enabled = true) {
  return useQuery<MessageResponseDTO[]>({
    // separate key for lead-external chat
    queryKey: ["messages", "lead", reportId],
    queryFn: () => messageApi.getMessagesByReportLeadExternal(reportId),
    enabled: !!reportId && enabled,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateMessageDTO) => messageApi.sendMessage(dto),
    onSuccess: (newMessage, dto) => {
      // The backend returns a MessageResponseDTO containing reportId and chatId.
      // based on the message sender: USER/OFFICER -> officer chat, LEAD/EXTERNAL -> lead chat.
      const reportId = newMessage.reportId as number;
      const isLeadChat = newMessage.sender === "LEAD" || newMessage.sender === "EXTERNAL";
      const targetKey = isLeadChat ? ["messages", "lead", reportId] : ["messages", "officer", reportId];

      qc.setQueryData<MessageResponseDTO[]>(targetKey, (old) =>
        old ? [...old, newMessage] : [newMessage]
      );

      // Invalidate both keys to ensure any stale queries reload authoritative server state.
      qc.invalidateQueries({ queryKey: ["messages", "lead", reportId] });
      qc.invalidateQueries({ queryKey: ["messages", "officer", reportId] });
    },
  });
}