import React, { useEffect, useState } from "react";
import { Box, Grid, Button, useMediaQuery, useTheme } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReportsList from "../components/ReportsList";
import ReportPreview from "../components/ReportPreview";
import Chat from "../components/Chat";
import { StatusType } from "../DTOs/StatusType";
import { ChatMode } from "../enums/ChatMode";
import { useGetTechLeadReports, useAssignTechAgent } from "../hook/techleadApi.hook";
import ConfirmDialog from "../components/ConfirmDialog";

const TechLeadHomePage: React.FC = () => {

    const {data: reports} = useGetTechLeadReports();

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [officerUsername, setOfficerUsername] = useState<string>("");
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMode, setChatMode] = useState<ChatMode | null>(null);

    const selectedReport = selectedIndex !== null ? reports?.[selectedIndex] : null;

    const assignTechAgentMutation = useAssignTechAgent();

    function toggleChatOpen(mode?: ChatMode) {
        // If a specific mode is requested, toggle that chat: close if it's already open, otherwise open it.
        if (mode !== undefined) {
            if (isChatOpen && chatMode === mode) {
                setIsChatOpen(false);
                setChatMode(null);
            } else {
                setChatMode(mode);
                setIsChatOpen(true);
            }
            return;
        }

        // No mode passed: toggle visibility. If closing, clear mode.
        if (isChatOpen) {
            setIsChatOpen(false);
            setChatMode(null);
        } else {
            setIsChatOpen(true);
        }
    }

    function assignReportToOfficer(action: 'approve'| 'reject', payload?: { assignee?: string }) {
        setConfirmOpen(true);
        setOfficerUsername(payload?.assignee ?? "");
    }

    function handleSelect(index: number | null) {
        setSelectedIndex(index);
        if (isMobile) setShowPreview(true);
    }

    async function performAssignment() {
        setConfirmOpen(false);
        if (!selectedReport) return;
        assignTechAgentMutation.mutateAsync({
            officerUsername: officerUsername,
            reportId: selectedReport.id,
        }).catch((e) => {
            console.error("Failed to assign tech agent", e);
        });

    }

    const statuses = [StatusType.Assigned, StatusType.InProgress, StatusType.Resolved, StatusType.Suspended, "All" ];
    return (
        <>
               <Box sx={{ pt: 4, pb: 4, px: 2, height: "fullvh", }}>
                {!isChatOpen ? (
                    isMobile ? (
                        showPreview ? (
                            <Grid item xs={12}>
                                <Box sx={{ mb: 1 }}>
                                    <Button variant="outlined" className="partecipation-button" startIcon={<ArrowBackIcon />} onClick={() => setShowPreview(false)}>Back to list</Button>
                                </Box>
                                <ReportPreview report={selectedReport} showTeamCard={true} onAction={assignReportToOfficer} showChat={true} openChat={toggleChatOpen} />
                            </Grid>
                        ) : (
                            <Grid item xs={12}>
                                <ReportsList reports={reports ?? []} selectedIndex={selectedIndex} onSelect={handleSelect} statuses={statuses} />
                            </Grid>
                        )
                    ) : (
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <ReportsList reports={reports ?? []} selectedIndex={selectedIndex} onSelect={handleSelect} statuses={statuses} />
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <ReportPreview report={selectedReport} showTeamCard={true} onAction={assignReportToOfficer} showChat={true} openChat={toggleChatOpen} />
                            </Grid>
                        </Grid>
                    )
                ) : (
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <ReportPreview report={selectedReport} showTeamCard={true} onAction={assignReportToOfficer} showChat={true} openChat={toggleChatOpen} />
                        </Grid>
                        <Grid item xs={12} md={6}>

                            {selectedReport ? (
                                <Chat
                                    reportId={selectedReport.id}
                                    chatId={selectedReport.chats?.find((chat) => chat.type === chatMode)?.id}
                                    chatMode={chatMode!}
                                    closeChat={() => toggleChatOpen()}
                                />
                            ) : null}
                        </Grid>
                    </Grid>
                )}
            </Box>

        <ConfirmDialog
            open={confirmOpen}
            title="Confirm assignment"
            description="Are you sure you want to assign this report to the selected officer?"
            itemLabel={`@${officerUsername}`}
            onClose={() => {setConfirmOpen(false) }}
            onConfirm={() => performAssignment()}
            confirmText="Confirm"
            cancelText="Cancel"
        />


        </>
    );
};

export default TechLeadHomePage;
