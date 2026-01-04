import React, { useEffect, useState } from "react";
import { Box, Grid, Button, useTheme, useMediaQuery } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReportsList from "../components/ReportsList";
import ReportPreview from "../components/ReportPreview";
import { StatusType } from "../DTOs/StatusType";
import { useGetTechReports } from "../hook/techApi.hook";
import { useUpdateReportStatus } from "../hook/reportApi.hook";
import ConfirmDialog from "../components/ConfirmDialog";
import Chat from "../components/Chat";
import { ChatMode } from "../enums/ChatMode";

const TechAgentHomePage: React.FC = () => {
  const { data: reports } = useGetTechReports();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<StatusType | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);


  const selectedReport = selectedIndex !== null ? reports?.[selectedIndex] : null;

  const updateStatusMutation = useUpdateReportStatus();

  async function performStatusUpdate() {
    if (!selectedReport) return;

    try {
      await updateStatusMutation.mutateAsync({
        reportId: selectedReport.id,
        payload: { newStatus: selectedStatus } as any,
      });
      setConfirmOpen(false);
    } catch (err) {
      console.error("Failed to update report status", err);
    }
  }

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode | null>(null);

  function toggleChatOpen(mode?: ChatMode) {
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

    if (isChatOpen) {
      setIsChatOpen(false);
      setChatMode(null);
    } else {
      setIsChatOpen(true);
    }
  }

  function assignStatusToReport(action: 'approve' | 'reject', payload?: { newStatus?: string }) {
    setConfirmOpen(true);
    setSelectedStatus(payload?.newStatus as StatusType ?? "");
  }

  function handleSelect(index: number | null) {
    setSelectedIndex(index);
    if (isMobile) setShowPreview(true);
  }
  const statuses = [StatusType.Assigned, StatusType.InProgress, StatusType.Resolved, StatusType.Suspended, "All"];
  return (
    <>
      <Box
        sx={{
          pt: 4,
          pb: 4,
          px: 2,
          height: "fullvh",
        }}>
        {!isChatOpen ? (
          isMobile ? (
            showPreview ? (
              <Grid item xs={12}>
                <Box sx={{ mb: 1 }}>
                  <Button variant="outlined" className="partecipation-button" startIcon={<ArrowBackIcon />} onClick={() => setShowPreview(false)}>Back to list</Button>
                </Box>
                <ReportPreview report={selectedReport} currentRole="AGENT" showUpdateStatus={true} onAction={assignStatusToReport} showChat={true} openChat={toggleChatOpen} />
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
                <ReportPreview report={selectedReport} currentRole="AGENT" showUpdateStatus={true} onAction={assignStatusToReport} showChat={true} openChat={toggleChatOpen} />
              </Grid>
            </Grid>
          )
        ) : (
          <Grid container spacing={2}>

            <Grid item xs={12} md={6}>
              <ReportPreview report={selectedReport} currentRole="AGENT" showUpdateStatus={true} onAction={assignStatusToReport} showChat={true} openChat={toggleChatOpen} />
            </Grid>
            <Grid item xs={12} md={6}>
              {selectedReport ? (
                <Chat
                  reportId={selectedReport.id}
                  chatId={selectedReport.chats?.find(c => c.type === chatMode)?.id}
                  chatMode={chatMode!}
                  currentRole="AGENT"
                  closeChat={() => toggleChatOpen()}
                />
              ) : null}
            </Grid>
          </Grid>
        )}


      </Box>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Status Update"
        description="Are you sure you want to update the status of this report to:"
        itemLabel={selectedStatus ?? ""}
        onClose={() => {
          setConfirmOpen(false);
        }}
        onConfirm={performStatusUpdate}
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </>
  );
};

export default TechAgentHomePage;