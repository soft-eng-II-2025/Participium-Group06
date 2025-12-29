import React, { useState, useEffect } from "react";
import { Box, Typography, Button, useTheme, useMediaQuery, Card, CardContent, CardActions, Stack, Dialog, TextField, Chip, Paper, DialogContent, IconButton } from "@mui/material";
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';
import MapForReportPreview from "./MapForReportPreview";
import { StatusType } from "../DTOs/StatusType";
import { useGetAgentsByTechLead } from "../hook/techleadApi.hook";
import { useAuth } from "../contexts/AuthContext";
import { MunicipalityOfficerResponseDTO } from "../DTOs/MunicipalityOfficerResponseDTO";
import TechOfficerCard from "./TechOfficerCard";
import TeamAssignmentCard from "./TeamAssignmentCard";
import { setStatusChipColor } from "../utils/stringUtilis";
import { useGetReportPhoto } from "../hook/userApi.hook";
import { ReportResponseDTO } from "../DTOs/ReportResponseDTO";
import { ChatMode } from "../enums/ChatMode";

type Props = {
    report?: ReportResponseDTO | null;
    showApprovalActions?: boolean;
    showTeamCard?: boolean;
    showUpdateStatus?: boolean;
    showChat?: boolean;
    isFlat?: boolean;
    // callback used to notify parent of actions. action is 'approve' or 'reject'.
    // payload can contain optional data like { reason } or { newStatus }
    onAction?: (action: 'approve' | 'reject', payload?: { reason?: string; newStatus?: string; assignee?: string }) => void;
    // openChat can be called with a ChatMode to open that chat or with no args to toggle/close
    openChat?: (chatType?: ChatMode) => void;
};


const statusesForUpdate = [StatusType.Assigned, StatusType.InProgress, StatusType.Resolved, StatusType.Suspended];

export default function ReportPreview({ report, showApprovalActions = false, showTeamCard = false, showUpdateStatus = false, isFlat = false, onAction, showChat = false, openChat }: Props) {
    const [isRejected, setIsRejected] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [statusButton, setStatusButton] = useState<StatusType | null>(null);
    const [rejectComment, setRejectComment] = useState('');
    const [officeMembers, setOfficeMembers] = useState(null as MunicipalityOfficerResponseDTO[] | null);
    const [externalMembers, setExternalMembers] = useState(null as MunicipalityOfficerResponseDTO[] | null);
    const { roles, isExternal } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const photoPath = report?.photos?.[selectedIndex];

    // only fetch blob for the currently selected photo
    const { data: photoBlob, isLoading: photoLoading } = useGetReportPhoto(photoPath, !!photoPath);
    const [photoSrc, setPhotoSrc] = useState<string | null>(null);
    const [imageOpen, setImageOpen] = useState(false);
    const [imageOpenSrc, setImageOpenSrc] = useState<string | null>(null);

    useEffect(() => {
        if (!photoBlob) {
            setPhotoSrc(null);
            return;
        }
        const url = URL.createObjectURL(photoBlob);
        setPhotoSrc(url);
        return () => { URL.revokeObjectURL(url); };
    }, [photoBlob]);

    function openImage(src?: string | null) {
        if (!src) return;
        setImageOpenSrc(src);
        setImageOpen(true);
    }

    // only fetch agents when showTeamCard is true
    const { data: techLeadAgents, isLoading: agentsLoading, isError: agentsError } = useGetAgentsByTechLead(showTeamCard);

    useEffect(() => {
        if (showTeamCard && report) {
            setOfficeMembers(techLeadAgents?.filter(a => a.external === false) ?? []);
            setExternalMembers(techLeadAgents?.filter(a => a.external === true) ?? []);
        } else {
            setOfficeMembers(null);
            setExternalMembers(null);
        }
    }, [report, showTeamCard, techLeadAgents]);

    // Reset transient UI state whenever a different report is selected
    useEffect(() => {
        // use report?.id so effect runs only when the selected report changes
        setIsRejected(false);
        setRejectComment('');
        setSelectedIndex(0);
        setStatusButton(null);
    }, [report?.id]);

    function getPhotoUrl(p: string) {
        if (!p) return '';

        return `/api/users/${p}`;
    }


    if (!report) {
        // Render empty state inside the same Card structure so layout stays consistent
        return (
            <Card sx={{ height: "85vh", borderRadius: 5, display: "flex", flexDirection: "column" }}>
                <CardContent sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700, mb: 1 }}>No report selected</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto' }}>
                            Select a report from the list to view its details.
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }


    return (
        <Card
            elevation={isFlat ? 0 : undefined}
            sx={{
                height: isFlat ? '100%' : '85vh',
                borderRadius: isFlat ? 0 : 5,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: isFlat ? 'transparent' : undefined,
                boxShadow: isFlat ? 'none' : undefined,
            }}
        >
            <CardContent sx={{ flex: 1, overflow: 'auto', p: isFlat ? 0 : undefined }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" color="primary" gutterBottom fontWeight={600}>
                        Report Details
                    </Typography>
                    {showChat && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {/* Tech Lead sees both chats when officer is external */}
                            {roles?.some(role => role.startsWith('TECH_LEAD')) && report.officer?.external && (
                                <>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<ChatBubbleOutlineIcon />}
                                        onClick={() => openChat?.(ChatMode.OFFICER_USER)}
                                    >
                                        Reporter
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<ChatBubbleOutlineIcon />}
                                        onClick={() => openChat?.(ChatMode.LEAD_EXTERNAL)}
                                    >
                                        External Maintainer
                                    </Button>
                                </>
                            )}

                            {/* External maintainer chats with tech lead */}
                            {isExternal && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<ChatBubbleOutlineIcon />}
                                    onClick={() => openChat?.(ChatMode.LEAD_EXTERNAL)}
                                >
                                    Municipality Officer
                                </Button>
                            )}

                            {/* Internal agent chats with reporter */}
                            {roles?.some(role => role.startsWith('TECH_AGENT')) && !isExternal && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<ChatBubbleOutlineIcon />}
                                    onClick={() => openChat?.(ChatMode.OFFICER_USER)}
                                >
                                    Reporter
                                </Button>
                            )}

                            {/* Internal agent chats with reporter */}
                            {roles?.some(role => role.startsWith('USER')) && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<ChatBubbleOutlineIcon />}
                                    onClick={() => openChat?.(ChatMode.OFFICER_USER)}
                                >
                                    Officer
                                </Button>
                            )}

                            {/* Close chat control (parent toggles visibility when called with no arg) */}
                            {/* Close chat control moved to Chat header (arrow) */}

                        </Box>
                    )}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" gutterBottom fontWeight={500}>
                        {report.title}
                    </Typography>
                    <Chip
                        color={setStatusChipColor(report.status, report) as any}
                        sx={{ alignSelf: 'center' }}
                        label={report.status}
                        size="medium"
                    />
                </Box>

                <MapForReportPreview latitude={report.latitude} longitude={report.longitude} interactive={false} zoom={14} isDrawer={isFlat} />

                <Stack direction="row" spacing={2} sx={{ mb: 1, mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">Cordinates:</Typography>

                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>{report.latitude}, {report.longitude}</Typography>

                </Stack>
                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Reporter:</Typography>
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                        {report.user?.first_name || report.user?.username} {report.user?.last_name ?? ''}
                    </Typography>

                </Stack>
                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Category:</Typography>
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                        {report.category}
                    </Typography>
                </Stack>

                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Date:</Typography>
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                        {new Date(report.createdAt).toLocaleString()}
                    </Typography>
                </Stack>

                <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                    Description
                </Typography>
                <Typography variant="body1" color="text.primary" sx={{ mb: 2 }}>
                    {report.description}
                </Typography>

                <Box
                    component="img"
                    src={photoSrc ?? undefined}
                    alt="Report photo"
                    onClick={() => openImage(photoSrc ?? getPhotoUrl(report.photos?.[0] ?? ''))}
                    sx={{
                        maxWidth: { xs: '100%', md: 300 },
                        width: '100%',
                        cursor: 'zoom-in',
                        // constrain tall (vertical) images so they don't dominate the layout
                        maxHeight: { xs: 160, md: 200 },
                        objectFit: 'contain',
                        display: 'block',
                        borderRadius: 2,
                        mr: { md: 0 },
                    }}
                />
                {report.photos && report.photos.length > 1 && (
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        {report.photos.map((p, i) => (
                            <Box
                                key={i}
                                component="img"
                                src={getPhotoUrl(p)}
                                alt={`photo-${i}`}
                                sx={{
                                    width: 72,
                                    height: 72,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                    border: selectedIndex === i ? '2px solid' : '2px solid transparent',
                                    borderColor: selectedIndex === i ? 'primary.main' : 'transparent'
                                }}
                                onClick={() => { setSelectedIndex(i); openImage(getPhotoUrl(p)); }}
                            />
                        ))}
                    </Stack>
                )}

                <Dialog fullScreen open={imageOpen} onClose={() => setImageOpen(false)} PaperProps={{ sx: { backgroundColor: 'rgba(0,0,0,0.9)' } }}>
                    <Box sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1400 }}>
                        <IconButton onClick={() => setImageOpen(false)} size="large" sx={{ color: 'common.white' }}><CloseIcon /></IconButton>
                    </Box>
                    <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 0, height: '100vh' }}>
                        {imageOpenSrc && (
                            <Box component="img" src={imageOpenSrc} alt="full-photo" sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        )}
                    </DialogContent>
                </Dialog>
            </CardContent>

            {report.status === StatusType.Rejected && report.explanation && (
                <Paper elevation={0} sx={{ p: 2, borderRadius: 1, mb: 2 }}>
                    <Typography variant="subtitle1" color="secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                        This report was rejected for the following reason:
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                        {report.explanation}
                    </Typography>
                </Paper>
            )}
            {!isRejected && showApprovalActions && report.status === StatusType.PendingApproval && <CardActions sx={{ mb: 2, flexShrink: 0 }}>
                <Button
                    color="success"
                    className="partecipation-button"
                    variant="contained"
                    onClick={() => onAction && onAction('approve')}
                    disabled={!onAction}
                    sx={{ mx: 1 }}
                >
                    Approve
                </Button>
                <Button
                    color="error"
                    className="partecipation-button"
                    variant="contained"
                    disabled={!onAction}
                    sx={{ mx: 1 }}
                    onClick={() => setIsRejected(!isRejected)}
                >
                    Reject
                </Button>


            </CardActions>}

            {isRejected && showApprovalActions && (report.status === StatusType.PendingApproval) &&
                <Box className="reject-comment" sx={{ px: 1, width: "100%", my: 3 }}>
                    <TextField
                        id="reject-comment-input"
                        label="Rejection explanation"
                        placeholder="Provide explanation for rejecting this report"
                        multiline
                        minRows={3}
                        fullWidth
                        color="secondary"
                        size="small"
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                    />
                    <Box className="actions" sx={{ display: 'flex', gap: 1, my: 3 }}>
                        <Button
                            color="error"
                            variant="contained"
                            onClick={() => onAction && onAction('reject', { reason: rejectComment })}
                            disabled={!rejectComment.trim()}
                        >
                            Submit rejection
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => { setIsRejected(false); setRejectComment(''); }}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            }
            {(showTeamCard && !report.officer) && (
                <TeamAssignmentCard reportId={report?.id} officeMembers={officeMembers} externalMembers={externalMembers} onAction={onAction} />
            )}

            {(showTeamCard && report.officer) && (
                <Box sx={{ bgcolor: 'inherit', borderTop: '1px solid', borderColor: 'grey.300', flexShrink: 0, p: 2, width: { xs: '100%', md: '100%' }, alignSelf: 'flex-start' }}>
                    <Typography variant="h6" color="secondary" sx={{ mb: 2, fontWeight: 'bold' }}>Assigned Officer</Typography>

                    <Box sx={{
                        display: 'flex',
                        gap: 2,
                        flexWrap: 'wrap',
                        alignItems: 'flex-start'
                    }}>
                        {report.leadOfficer && (
                            <Box sx={{ width: { xs: '100%', md: '33%' } }}>
                                <TechOfficerCard user={report.leadOfficer as any} selected={false} onClick={undefined} sx={{ width: '100%' }} />
                            </Box>
                        )}

                        <Box sx={{ width: { xs: '100%', md: '33%' } }}>
                            <TechOfficerCard user={report.officer} selected={false} onClick={undefined} sx={{ width: '100%' }} />
                        </Box>
                    </Box>
                </Box>
            )}

            {(showUpdateStatus) && (report.status === StatusType.Assigned
                || report.status === StatusType.InProgress
                || report.status === StatusType.Suspended) && (
                    <CardContent sx={{ bgcolor: 'inherit', borderTop: '1px solid', borderColor: 'grey.300', flexShrink: 0 }}>
                        <Typography variant="h6" color="secondary" sx={{ mb: 1, fontWeight: 'bold' }}>Update report status</Typography>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, mb: 1 }}>
                            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                                {statusesForUpdate.filter((s) => s !== StatusType.Assigned).map((status) => (
                                    <Button
                                        key={status}
                                        variant={statusButton === status ? 'contained' : 'outlined'}
                                        color="secondary"
                                        className="partecipation-button"
                                        sx={{ mr: 1, mb: 1, minWidth: 140, textTransform: 'none' }}
                                        onClick={() => setStatusButton(prev => prev === status ? null : status)}
                                    >
                                        {status}
                                    </Button>
                                ))}
                            </Stack>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Choose a status and update the report
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="success"
                                    className="partecipation-button"
                                    sx={{ ml: 2 }}
                                    disabled={!statusButton}
                                    onClick={() => {
                                        // send an explicit newStatus to parent so it can update without confirmation
                                        if (onAction && statusButton) {
                                            onAction('approve', { newStatus: statusButton as string });
                                        }
                                    }}
                                >
                                    Update
                                </Button>
                            </Box>
                        </Paper>
                    </CardContent>
                )}

        </Card >
    );
}