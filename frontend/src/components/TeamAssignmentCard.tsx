import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TechOfficerCard from "./TechOfficerCard";
import { MunicipalityOfficerResponseDTO } from "../DTOs/MunicipalityOfficerResponseDTO";

type Props = {
    officeMembers?: MunicipalityOfficerResponseDTO[] | null;
    externalMembers?: MunicipalityOfficerResponseDTO[] | null;
    onAction?: (action: 'approve' | 'reject', payload?: { reason?: string; newStatus?: string; assignee?: string }) => void;
    reportId?: number | string | null;
};

export default function TeamAssignmentCard({ officeMembers, externalMembers, onAction, reportId }: Props) {
    const [selectedOfficerUsername, setSelectedOfficerUsername] = useState<string | null>(null);
    const [selectedExternalUsername, setSelectedExternalUsername] = useState<string | null>(null);

    // Clear selection whenever the parent report changes so choices don't persist
    useEffect(() => {
        setSelectedOfficerUsername(null);
        setSelectedExternalUsername(null);
    }, [reportId]);

    return (
        <Box sx={{ bgcolor: 'inherit', borderTop: '1px solid', borderColor: 'grey.300', flexShrink: 0 }}>
            {/* Internal team - opened by default */}
            <Accordion defaultExpanded disableGutters square sx={{ mb: 0, '&.Mui-expanded': { mb: 0 } }}>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        '& .MuiAccordionSummary-expandIconWrapper': { order: -1, mr: 1 },
                        '& .MuiAccordionSummary-content': { marginLeft: 0 }
                    }}
                >
                    <Typography variant="h6" color="secondary" fontWeight={800}>Assign to Office Member</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 2 }}>
                    <>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1 }}>
                            {officeMembers && officeMembers.length > 0 ? (
                                officeMembers.map((user) => (
                                    <TechOfficerCard
                                        key={user.username}
                                        user={user}
                                        selected={selectedOfficerUsername === user.username}
                                        onClick={() => { setSelectedOfficerUsername(prev => prev === user.username ? null : user.username); setSelectedExternalUsername(null); }}
                                    />
                                ))
                            ) : (
                                <Box sx={{ gridColumn: '1 / -1', p: 1 }}>
                                    <Typography variant="body2" color="text.secondary">No office members available.</Typography>
                                </Box>
                            )}
                        </Box>
                        <Box sx={{ mt: 2 }}>
                            <Button
                                variant="contained"
                                className="partecipation-button"
                                color="secondary"
                                disabled={!selectedOfficerUsername}
                                onClick={() => {
                                    if (onAction) {
                                        onAction('approve', { assignee: selectedOfficerUsername ?? undefined });
                                    }
                                }}
                            >
                                Assign to officer
                            </Button>
                        </Box>
                    </>
                </AccordionDetails>
            </Accordion>

            {/* External maintainers */}
            <Accordion disableGutters square sx={{ mb: 0, '&.Mui-expanded': { mb: 0 } }}>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        '& .MuiAccordionSummary-expandIconWrapper': { order: -1, mr: 1 },
                        '& .MuiAccordionSummary-content': { marginLeft: 0 }
                    }}
                >
                    <Typography variant="h6" color="secondary" fontWeight={800}>Assign to External Maintainer</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 2 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 1 }}>
                        {externalMembers && externalMembers.length > 0 ? (
                            externalMembers.map((user) => (
                                <TechOfficerCard
                                    key={user.username}
                                    user={user as any}
                                    selected={selectedExternalUsername === user.username}
                                    onClick={() => { setSelectedExternalUsername(prev => prev === user.username ? null : user.username); setSelectedOfficerUsername(null); }}
                                />
                            ))
                        ) : (
                            <Box sx={{ gridColumn: '1 / -1', p: 1 }}>
                                <Typography variant="body2" color="text.secondary">No external maintainers available.</Typography>
                            </Box>
                        )}
                    </Box>
                    <Box sx={{ mt: 2 }}>
                        <Button
                            variant="contained"
                            className="partecipation-button"
                            color="secondary"
                            disabled={!selectedExternalUsername}
                            onClick={() => {
                                if (onAction) {
                                    onAction('approve', { assignee: selectedExternalUsername ?? undefined });
                                }
                            }}
                        >
                            Assign external maintainer
                        </Button>
                    </Box>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
}
