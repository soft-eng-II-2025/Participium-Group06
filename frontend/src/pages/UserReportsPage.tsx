import React, { useEffect, useState } from "react";
import { Box, Grid } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useUserReports } from "../hook/useUserReports.hook";
import ReportsList from "../components/ReportsList";
import ReportPreview from "../components/ReportPreview";
import Chat from "../components/Chat";

const UserReportsPage: React.FC = () => {
  const { user } = useAuth();
  const username = user?.username ?? "";

  const { reports = [], loading, error } = useUserReports(username);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (reports.length && selectedIndex === null) {
      setSelectedIndex(0);
    }
  }, [reports]);

  const selectedReport =
    selectedIndex !== null ? reports[selectedIndex] : null;

  const statuses = ["All"]; // Users cannot filter by status

  function toggleChatOpen() {
    setIsChatOpen((prev) => !prev);
  }

  return (
    <Box sx={{ pt: 4, pb: 4, px: 2, height: "fullvh" }}>
      {loading && <div>Loading your reports...</div>}
      {error && <div style={{ color: "red" }}>Failed to load reports: {error}</div>}

      {!isChatOpen ? (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <ReportsList
              reports={reports}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              statuses={statuses}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <ReportPreview
              report={selectedReport}
              showUpdateStatus={false} // users cannot update status
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
              showUpdateStatus={false}
              showChat={true}
              openChat={toggleChatOpen}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            {selectedReport && <Chat reportId={selectedReport.id} />}
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default UserReportsPage;
