import React from "react";
import { Drawer, Box, IconButton } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { ReportResponseDTO } from "../DTOs/ReportResponseDTO";
import ReportPreview from "./ReportPreview";

interface ReportDrawerProps {
    open: boolean;
    onClose: () => void;
    report: ReportResponseDTO | null;
    width?: string;
}

const ReportDrawer: React.FC<ReportDrawerProps> = ({ open, onClose, report, width = "35vw" }) => {
    return (
        <Drawer anchor="right" open={open} onClose={onClose}>
            <Box sx={{ width, maxWidth: "100vw" }} role="presentation">

                <Box sx={{ display: 'flex', alignItems: 'right', justifyContent: 'flex-end', pt: 1}}>
                    <IconButton onClick={onClose} aria-label="Close report drawer">
                        <CloseIcon color="primary" />
                    </IconButton>
                </Box>

                <Box sx={{ p: 2 }}>
                    <ReportPreview report={report} isFlat={true} />
                </Box>
            </Box>
        </Drawer>
    );
};

export default ReportDrawer;
