// frontend: src/hook/messages.hook.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageApi} from "../api/messageApi";
import {SendMessageRequestDTO} from "../DTOs/SendMessageRequestDTO";
import { MessageResponseDTO } from "../DTOs/MessageResponseDTO";

const messageApi = new MessageApi();

export function useMessagesByReport(reportId: number, enabled = true) {
  return useQuery<MessageResponseDTO[]>({
    queryKey: ["messages", reportId],
    queryFn: () => messageApi.getMessagesByReport(reportId),
    enabled: !!reportId && enabled,
    staleTime: 30_000,
  });
}

export function useSendMessage(reportId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: SendMessageRequestDTO) =>
      messageApi.sendMessage(payload,reportId),
    onSuccess: (newMessage) => {
      qc.setQueryData<MessageResponseDTO[]>(
        ["messages", reportId],
        (old) => (old ? [...old, newMessage] : [newMessage])
      );
    },
  });
}