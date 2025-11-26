import React, { useEffect } from 'react';
import { IconButton, Badge, Drawer, List, ListItem, ListItemText, ListItemIcon, Typography, CircularProgress, Divider, Box, Tooltip, Button } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { useGetMyNotifications, useDeleteNotification, useMarkAsReadNotification } from '../hook/notificationApi.hook';
import { subscribeToNewNotifications, unsubscribeFromNewNotifications } from '../services/socketClient';
import { NotificationDTO } from '../DTOs/NotificationDTO';
import { useQueryClient } from '@tanstack/react-query';
import ConfirmDialog from './ConfirmDialog';

export default function NotificationsMenu() {
    const [openDrawer, setOpenDrawer] = React.useState(false);

    const { data: notifications = [], isLoading } = useGetMyNotifications();
    const deleteNotification = useDeleteNotification();
    const markAsRead = useMarkAsReadNotification();
    const queryClient = useQueryClient();
    const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);
    const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = React.useState(false);

    // subscribe to live notifications via socket and update react-query cache
    useEffect(() => {
        const handler = (n: NotificationDTO) => {
            queryClient.setQueryData<NotificationDTO[] | undefined>(['notifications'], (old) => {
                if (!old) return [n];
                if (old.some((x) => (x as any).id === (n as any).id)) return old;
                return [n, ...old];
            });
        };

        subscribeToNewNotifications(handler);
        return () => unsubscribeFromNewNotifications(handler);
    }, []);



    return (
        <>
            <IconButton color="inherit" onClick={() => setOpenDrawer(true)} aria-label="notifications" size="large">
                <Badge badgeContent={Array.isArray(notifications) ? notifications.filter((n: NotificationDTO) => !n.is_read).length : 0} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Drawer anchor="right" open={openDrawer} onClose={() => setOpenDrawer(false)}>
                <Box sx={{ width: 360, maxWidth: '100vw' }} role="presentation">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, gap: 1 }}>
                        <Typography variant="h6">Notifications</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Tooltip title="Delete all notifications">
                                <Button
                                    startIcon={<DeleteIcon />}
                                    color="inherit"
                                    className='partecipation-button'
                                    variant="outlined"
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteAllOpen(true); }}
                                    disabled={isBulkDeleting || !notifications || notifications.length === 0}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Delete all
                                </Button>
                            </Tooltip>
                            <IconButton onClick={() => setOpenDrawer(false)} size="small" aria-label="close notifications">
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>
                    <Divider />
                    <Box sx={{ p: 1 }}>
                        {isLoading ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                                <CircularProgress size={20} />
                                <Typography variant="body2">Loading...</Typography>
                            </Box>
                        ) : (!notifications || notifications.length === 0) ? (
                            <Box sx={{ p: 2 }}>
                                <Typography variant="body2" color="text.secondary">No notifications</Typography>
                            </Box>
                        ) : (
                            <List>
                                {notifications.map((n: NotificationDTO, idx: number) => (
                                    <div key={(n as any).id ?? idx}>
                                        <ListItem
                                            button
                                            onClick={() => { if (!n.is_read) markAsRead.mutate(Number((n as any).id)); }}
                                            secondaryAction={
                                                <IconButton edge="end" aria-label="delete" onClick={(e) => { e.stopPropagation(); deleteNotification.mutate(Number((n as any).id)); }}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            }
                                        >
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                {/* unread indicator */}
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: n.is_read ? 'transparent' : 'secondary.main', border: n.is_read ? '1px solid rgba(0,0,0,0.12)' : 'none' }} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={<Typography sx={{ fontWeight: n.is_read ? 'normal' : 700 }}>{n.content}</Typography>}
                                                secondary={new Date(n.created_at).toLocaleString()}
                                            />
                                        </ListItem>
                                        <Divider component="li" />
                                    </div>
                                ))}
                            </List>
                        )}
                    </Box>
                </Box>
            </Drawer>
            <ConfirmDialog
                open={confirmDeleteAllOpen}
                title="Delete all notifications"
                description={`This will permanently delete ${notifications?.length ?? 0} notifications for your account. This action cannot be undone.`}
                itemLabel={notifications && notifications.length > 0 ? `${notifications.length} notifications` : undefined}
                onClose={() => setConfirmDeleteAllOpen(false)}
                loading={isBulkDeleting}
                confirmText="Delete all"
                cancelText="Cancel"
                onConfirm={async () => {
                    setIsBulkDeleting(true);
                    try {
                        if (notifications && notifications.length > 0) {
                            await Promise.all(notifications.map((n: NotificationDTO) => deleteNotification.mutateAsync(Number((n as any).id))));
                            await queryClient.invalidateQueries({ queryKey: ['notifications'] });
                        }
                    } catch (err) {
                    } finally {
                        setIsBulkDeleting(false);
                        setConfirmDeleteAllOpen(false);
                    }
                }}
            />
        </>
    );
}