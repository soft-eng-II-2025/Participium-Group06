import React, { useState } from "react";
import { Box, Grid } from "@mui/material";
import ReportsList from "../components/ReportsList";
import ReportPreview from "../components/ReportPreview";
import { StatusType } from "../DTOs/StatusType";
import { useGetTechReports } from "../hook/techApi.hook";
import { useUpdateReportStatus } from "../hook/reportApi.hook";
import ConfirmDialog from "../components/ConfirmDialog";
import Chat from "../components/Chat";

const TechAgentHomePage: React.FC = () => {
  const { data: reports } = useGetTechReports();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    reports?.length ? 0 : null
  );
  const [selectedStatus, setSelectedStatus] = useState<StatusType | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  function toggleChatOpen() {
    setIsChatOpen((prev) => !prev);
  }

  function assignStatusToReport(
    action: "approve" | "reject",
    payload?: { newStatus?: string }
  ) {
    setConfirmOpen(true);
    setSelectedStatus((payload?.newStatus as StatusType) ?? "");
  }

  const statuses = [
    StatusType.Assigned,
    StatusType.InProgress,
    StatusType.Resolved,
    StatusType.Suspended,
    "All",
  ];

  return (
    <>
      <Box
        sx={{
          pt: 4,
          pb: 4,
          px: 2,
          height: "fullvh",
        }}
      >
        {!isChatOpen ? (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <ReportsList
                reports={reports ?? []}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
                statuses={statuses}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <ReportPreview
                report={selectedReport}
                showUpdateStatus={true}
                onAction={assignStatusToReport}
                showChat={true}
                openChat={toggleChatOpen}
              />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <ReportPreview
                report={selectedReport}
                showUpdateStatus={true}
                onAction={assignStatusToReport}
                showChat={true}
                openChat={toggleChatOpen}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              {selectedReport ? (
                <Chat reportId={selectedReport.id} />
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