import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NotificationApi } from "../api/notificationApi";
import { NotificationDTO } from "../DTOs/NotificationDTO";

const notificationApi = new NotificationApi();

export function useGetMyNotifications() {
    return useQuery<NotificationDTO[]>({
        queryKey: ["notifications"],
        queryFn: () => notificationApi.getMyNotifications(),
    });
}

export function useDeleteNotification() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (notificationId: number) => notificationApi.deleteNotification(notificationId),
        onSuccess: () => {
            // refresh notifications list after deletion
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}

export function useMarkAsReadNotification() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (notificationId: number) => notificationApi.markAsRead(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
}

export default notificationApi;
