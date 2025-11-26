import React, { useEffect, useState } from "react";
import { Box, Grid, Button, useMediaQuery, useTheme } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReportsList from "../components/ReportsList";
import ReportPreview from "../components/ReportPreview";
import { StatusType } from "../DTOs/StatusType";
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

    const selectedReport = selectedIndex !== null ? reports?.[selectedIndex] : null;

    const assignTechAgentMutation = useAssignTechAgent();

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
               <Box sx={{ pt: 4, pb: 4, px: 2, height: "100vh", }}>
                <Grid container spacing={2}>
                    {isMobile ? (
                        showPreview ? (
                            <Grid item xs={12}>
                                <Box sx={{ mb: 1 }}>
                                    <Button variant="outlined" className="partecipation-button" startIcon={<ArrowBackIcon />} onClick={() => setShowPreview(false)}>Back to list</Button>
                                </Box>
                                <ReportPreview report={selectedReport} showTeamCard={true} onAction={assignReportToOfficer} />
                            </Grid>
                        ) : (
                            <Grid item xs={12}>
                                <ReportsList reports={reports ?? []} selectedIndex={selectedIndex} onSelect={handleSelect} statuses={statuses} />
                            </Grid>
                        )
                    ) : (
                        <>
                            <Grid item xs={12} md={4}>
                                <ReportsList reports={reports ?? []} selectedIndex={selectedIndex} onSelect={handleSelect} statuses={statuses} />
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <ReportPreview report={selectedReport} showTeamCard={true} onAction={assignReportToOfficer} />
                            </Grid>
                        </>
                    )}
                </Grid>
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
