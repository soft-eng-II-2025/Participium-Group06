import React, { useEffect, useState } from "react";
import { Box, Grid } from "@mui/material";
import ReportsList from "../components/ReportsList";
import ReportPreview from "../components/ReportPreview";
import { StatusType } from "../DTOs/StatusType";
import { useGetTechLeadReports, useAssignTechAgent } from "../hook/techleadApi.hook";
import ConfirmDialog from "../components/ConfirmDialog";
import { ReportResponseDTO } from "../DTOs/ReportResponseDTO";

const TechLeadHomePage: React.FC = () => {

    const {data: reports} = useGetTechLeadReports();

    const [officerUsername, setOfficerUsername] = useState<string>("");
    const [selectedIndex, setSelectedIndex] = useState<number | null>(reports?.length ? 0 : null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const selectedReport = selectedIndex !== null ? reports?.[selectedIndex] : null;

    const assignTechAgentMutation = useAssignTechAgent();

    function assignReportToOfficer(action: 'approve'| 'reject', payload?: { assignee?: string }) {
        setConfirmOpen(true);
        setOfficerUsername(payload?.assignee ?? "");
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
                    <Grid item xs={12} md={4}>
                        <ReportsList reports={reports ?? []} selectedIndex={selectedIndex} onSelect={setSelectedIndex} statuses={statuses} />
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <ReportPreview report={selectedReport} showTeamCard={true} onAction={assignReportToOfficer} />
                    </Grid>
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
