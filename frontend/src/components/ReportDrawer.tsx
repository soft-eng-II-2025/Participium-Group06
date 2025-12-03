import React from "react";
import { Drawer, Box, IconButton, useTheme, useMediaQuery } from "@mui/material";
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
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));


    const paperSx = isMobile
        ? { width: '100vw', height: '100vh', maxWidth: '100vw' }
        : { width, maxWidth: '100vw' };

    return (
        <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: paperSx }}>
            <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }} role="presentation">

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, position: 'sticky', top: 0, zIndex: 1200, bgcolor: 'background.paper' }}>
                    <Box sx={{ flex: 1 }} />
                    <IconButton onClick={onClose} aria-label="Close report drawer">
                        <CloseIcon color="primary" />
                    </IconButton>
                </Box>

                <Box sx={{ p: isMobile ? 1 : 2, overflow: 'auto', flex: 1 , width: '100vw'}}>
                    <ReportPreview report={report} isFlat={true} />
                </Box>
            </Box>
        </Drawer>
    );
};

export default ReportDrawer;
