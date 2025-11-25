// src/components/UserReportPreview.tsx

import React from "react";
import { Paper, Box, Typography, Button } from "@mui/material";
import { ReportResponseDTO } from "../DTOs/ReportResponseDTO";

interface Props {
    report: ReportResponseDTO | null;
    openChat: () => void;
}

const UserReportPreview: React.FC<Props> = ({ report, openChat }) => {
    if (!report) {
        return (
            <Paper elevation={3} sx={{ p: 2 }}>
                <Typography>Select a report to view details.</Typography>
            </Paper>
        );
    }

    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
                Report #{report.id}
            </Typography>

            <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Status:</strong> {report.status}
            </Typography>

            <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Description:</strong> {report.description}
            </Typography>

            <Button variant="contained" onClick={openChat}>
                Open Chat
            </Button>
        </Paper>
    );
};

export default UserReportPreview;
