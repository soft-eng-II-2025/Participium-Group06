// frontend: src/hook/messages.hook.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageApi, SendMessageRequestDTO } from "../api/messageApi";
import { MessageDTO } from "../DTOs/MessageDTO";

const messageApi = new MessageApi();

export function useMessagesByReport(reportId: number, enabled = true) {
  return useQuery<MessageDTO[]>({
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
      messageApi.sendMessage(payload),
    onSuccess: (newMessage) => {
      qc.setQueryData<MessageDTO[]>(
        ["messages", reportId],
        (old) => (old ? [...old, newMessage] : [newMessage])
      );
    },
  });
}