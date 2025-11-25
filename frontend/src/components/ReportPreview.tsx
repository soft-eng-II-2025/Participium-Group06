import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Card, CardContent, CardActions, Stack, TextField, Chip, Paper } from "@mui/material";
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { CreateReportDTO } from "../DTOs/CreateReportDTO";
import MapForReportPreview from "./MapForReportPreview";
import { StatusType } from "../DTOs/StatusType";
import { useGetAgentsByTechLead } from "../hook/techleadApi.hook";
import { useAuth } from "../contexts/AuthContext";
import { MunicipalityOfficerResponseDTO } from "../DTOs/MunicipalityOfficerResponseDTO";
import TechOfficerCard from "./TechOfficerCard";
import { setStatusChipColor } from "../utils/stringUtilis";
import { useGetReportPhoto } from "../hook/userApi.hook";

type Props = {
    report?: CreateReportDTO | null;
    showApprovalActions?: boolean;
    showTeamCard?: boolean;
    showUpdateStatus?: boolean;
    showChat?: boolean;
    // callback used to notify parent of actions. action is 'approve' or 'reject'.
    // payload can contain optional data like { reason } or { newStatus }
    onAction?: (action: 'approve' | 'reject', payload?: { reason?: string; newStatus?: string; assignee?: string }) => void;
    openChat?: () => void;
    onChatToggle?: (open: boolean) => void;
};


const statusesForUpdate = [StatusType.Assigned, StatusType.InProgress, StatusType.Resolved, StatusType.Suspended];

export default function ReportPreview({ report, showApprovalActions = false, showTeamCard = false, showUpdateStatus = false, onAction, showChat = false, openChat, onChatToggle }: Props) {
    const [isRejected, setIsRejected] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [statusButton, setStatusButton] = useState<StatusType | null>(null);
    const [rejectComment, setRejectComment] = useState('');
    const [officeMembers, setOfficeMembers] = useState(null as MunicipalityOfficerResponseDTO[] | null);
    const [selectedOfficerUsername, setSelectedOfficerUsername] = useState<string | null>(null);
    const { user } = useAuth();
    const [chatOpen, setChatOpen] = useState(false);

    const photoPath = report?.photos?.[selectedIndex];

    // only fetch blob for the currently selected photo
    const { data: photoBlob, isLoading: photoLoading } = useGetReportPhoto(photoPath, !!photoPath);
    const [photoSrc, setPhotoSrc] = useState<string | null>(null);

    useEffect(() => {
        if (!photoBlob) {
            setPhotoSrc(null);
            return;
        }
        const url = URL.createObjectURL(photoBlob);
        setPhotoSrc(url);
        return () => { URL.revokeObjectURL(url); };
    }, [photoBlob]);

    // only fetch agents when showTeamCard is true
    const { data: techLeadAgents, isLoading: agentsLoading, isError: agentsError } = useGetAgentsByTechLead(showTeamCard);

    useEffect(() => {
        setChatOpen(false);
        if (showTeamCard && report) {
            setOfficeMembers(techLeadAgents ?? []);
        } else {
            setOfficeMembers(null);
        }
    }, [report, showTeamCard, techLeadAgents]);

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
        <Card sx={{ height: "85vh", borderRadius: 5, display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ flex: 1, overflow: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" color="primary" gutterBottom fontWeight={600}>
                        Report Details
                    </Typography>
                    {showChat && (
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ChatBubbleOutlineIcon />}
                            onClick={openChat}
                        >
                            chat
                        </Button>
                    )}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" gutterBottom fontWeight={400}>
                        {report.title}
                    </Typography>
                    <Chip
                        color={setStatusChipColor(report.status, report) as any}
                        sx={{ alignSelf: 'center' }}
                        label={report.status}
                        size="medium"
                    />
                </Box>

                <MapForReportPreview latitude={report.latitude} longitude={report.longitude} interactive={false} zoom={14} />

                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <Typography variant="caption">Coordinates:</Typography>
                    <Typography variant="body2">{report.latitude}, {report.longitude}</Typography>
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
                    sx={{
                        maxWidth: { xs: '100%', md: 300 },
                        width: '100%',
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
                                onClick={() => setSelectedIndex(i)}
                            />
                        ))}
                    </Stack>
                )}
            </CardContent>

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
            {(showTeamCard) && (

                (!report.officer) ? (<CardContent sx={{ bgcolor: 'inherit', borderTop: '1px solid', borderColor: 'grey.300', flexShrink: 0 }}>
                    <Typography variant="h6" color="secondary" sx={{ mb: 1 }}>Assign this report to:</Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1, }}>
                        {officeMembers?.map((user) => {
                            return (
                                <TechOfficerCard
                                    user={user}
                                    selected={selectedOfficerUsername === user.username}
                                    onClick={() => setSelectedOfficerUsername(prev => prev === user.username ? null : user.username)}
                                />
                            );
                        })}


                    </Box>
                    <Box sx={{ mt: 2 }}>
                        <Button
                            variant="contained"
                            className="partecipation-button"
                            color="secondary"
                            disabled={!selectedOfficerUsername}
                            onClick={() => {
                                if (onAction) {
                                    onAction('approve', { assignee: selectedOfficerUsername ?? undefined });
                                }
                            }}
                        >
                            Assign to officer
                        </Button>
                    </Box>
                </CardContent>
                ) : (
                    <CardContent sx={{ bgcolor: 'inherit', borderTop: '1px solid', borderColor: 'grey.300', flexShrink: 0 }}>
                        <Typography variant="h6" color="secondary" sx={{ mb: 1, }}>Assigned to:</Typography>
                        <Box sx={{ maxWidth: 300 }}>
                            <TechOfficerCard
                                user={report.officer}
                                selected={false}
                            />
                        </Box>
                    </CardContent>
                )

            )}

            {(showUpdateStatus) && report.status === StatusType.Assigned && (
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