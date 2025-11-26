// src/pages/AdminRegisterPage.tsx
import React, { useEffect, useState } from "react";
import { Container, Box, Grid, Button, useMediaQuery, useTheme, Typography } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ConfirmDialog from "../components/ConfirmDialog";
import ReportsList from "../components/ReportsList";
import ReportPreview from "../components/ReportPreview";
import { StatusType } from "../DTOs/StatusType";
import { useGetAllReports } from "../hook/reportApi.hook";
import { useUpdateReportStatus } from "../hook/reportApi.hook";
import { ReportResponseDTO } from "../DTOs/ReportResponseDTO";

const OrganizationOfficerHomePage: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const { data: reports } = useGetAllReports();

    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        if ((selectedIndex === null || selectedIndex === undefined) && reports && reports.length > 0) {
            setSelectedIndex(null);
        }
    }, [reports, selectedIndex]);

    const selectedReport = selectedIndex !== null ? reports?.[selectedIndex] : null;
    const updateStatusMutation = useUpdateReportStatus();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [approving, setApproving] = useState(false);
    const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);
    const [pendingPayload, setPendingPayload] = useState<{ reason?: string; newStatus?: string; } | undefined>(undefined);


    async function performAction(action: 'approve' | 'reject', payload?: { reason?: string; newStatus?: string; }) {
        if (!selectedReport || typeof selectedReport.id !== 'number') return;

        const newStatus = payload?.newStatus ?? (action === 'approve' ? StatusType.Assigned : StatusType.Rejected);

        try {
            setApproving(true);
            await updateStatusMutation.mutateAsync({ reportId: selectedReport.id, payload: { newStatus, explanation: payload?.reason, } as any });
            // refetch list after successful update
            setConfirmOpen(false);
            setPendingAction(null);
            setApproving(false);
        } catch (err) {
            console.error(`Failed to ${action} report`, err);
            setApproving(false);
        }
    }

    function handleActionFromChild(action: 'approve' | 'reject', payload?: { reason?: string; newStatus?: string; }) {
        setPendingPayload(payload);
        setPendingAction(action);
        setConfirmOpen(true);
    }

    // when a report is selected from the list
    function handleSelect(index: number | null) {
        setSelectedIndex(index);
        if (isMobile) {
            // switch to preview view on small screens
            setShowPreview(true);
        }
    }

    const statuses = [StatusType.PendingApproval, StatusType.Assigned, StatusType.InProgress, StatusType.Resolved, StatusType.Rejected, StatusType.Suspended, "All"];

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
                                <ReportPreview report={selectedReport} showApprovalActions={true} onAction={handleActionFromChild} />
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
                                <ReportPreview report={selectedReport} showApprovalActions={true} onAction={handleActionFromChild} />
                            </Grid>
                        </>
                    )}
                </Grid>
            </Box>

            <ConfirmDialog
                open={confirmOpen}
                title={pendingAction === 'reject' ? 'Confirm rejection' : 'Confirm approval'}
                description={
                    pendingAction === 'reject'
                        ? (
                            <div>Are you sure you want to reject this report?</div>

                        )
                        : <div>Are you sure you want to approve and assign this report?</div>
                }
                itemLabel={selectedReport ? (selectedReport.title ?? selectedReport.description ?? `#${selectedReport.id}`) : undefined}
                onClose={() => { if (!approving) { setConfirmOpen(false); setPendingAction(null); setPendingPayload(undefined); } }}
                onConfirm={() => performAction(pendingAction ?? 'approve', pendingPayload)}
                loading={approving}
                confirmText="Confirm"
                cancelText="Cancel"
            />


        </>
    );
};

export default OrganizationOfficerHomePage;

