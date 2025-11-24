// frontend/src/hook/messagesApi.hook.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { messageApi, CreateMessageDTO } from "../api/messageApi";
import { MessageResponseDTO } from "../DTOs/MessageResponseDTO";

export function useMessagesByReport(reportId: number, enabled = true) {
  return useQuery<MessageResponseDTO[]>({
    queryKey: ["messages", reportId],
    queryFn: () => messageApi.getMessagesByReport(reportId),
    enabled: !!reportId && enabled,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateMessageDTO) => messageApi.sendMessage(dto),
    onSuccess: (newMessage, dto) => {
      qc.setQueryData<MessageResponseDTO[]>(
        ["messages", dto.report_id],
        (old) => (old ? [...old, newMessage] : [newMessage])
      );
    },
  });
}