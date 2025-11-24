import React, { useEffect, useRef, useState } from "react";
import { List, ListItemButton, ListItemText, Chip, CircularProgress, Box, Typography, ListItemAvatar, Avatar, Button, ButtonGroup, Stack } from "@mui/material";
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { CreateReportDTO } from "../DTOs/CreateReportDTO";
import { StatusType } from "../DTOs/StatusType";
import { getCategoryIcon } from "../utils/utils";
import { setStatusChipColor } from "../utils/stringUtilis";

type Props = {
    reports: any[];
    selectedIndex: number | null;
    statuses: string[];
    onSelect: (index: number) => void;
    onLoadMore?: () => void;
    hasMore?: boolean;
    isLoading?: boolean;
};

export default function ReportsList({ reports, selectedIndex, onSelect, onLoadMore, hasMore = false, isLoading = false, statuses }: Props) {
    const [selectedStatus, setSelectedStatus] = useState<string>(statuses[0]);


    const itemsWithIndex = reports.map((r, idx) => ({ r, idx }));
    const filtered = itemsWithIndex.filter(({ r }) => selectedStatus === 'All' ? true : r.status === selectedStatus);

    return (
        <>
            <Box sx={{ mb: 1, display: 'flex', width: '100%' }}>
                <ButtonGroup variant="outlined" size="small" aria-label="status filters" sx={{
                    width: '100%',
                    mb: 1,
                }} fullWidth>
                    {statuses.map((s) => (
                        <Button
                            key={s}
                            size="small"
                            className="participation-button"
                            variant={selectedStatus === s ? 'contained' : 'outlined'}
                            onClick={() => setSelectedStatus(s)}
                            sx={{ borderRadius: 3, flex: 1 }}
                        >
                            {s}
                        </Button>
                    ))}
                </ButtonGroup>
            </Box>

            <List
                disablePadding
                sx={{
                    maxHeight: "80vh",
                    overflow: "auto",
                    backgroundColor: "transparent", // make container transparent so gaps show page background
                    borderRadius: 5,
                }}
            >
                {isLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                )}

                {!isLoading && filtered.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            No reports found for "{selectedStatus}".
                        </Typography>
                        <Stack direction="row" spacing={1} justifyContent="center">
                            <Button size="small" onClick={() => setSelectedStatus('All')}>Show all</Button>
                            {onLoadMore && <Button size="small" onClick={() => onLoadMore()}>Retry / Load more</Button>}
                        </Stack>
                    </Box>
                )}

                {filtered.map(({ r, idx }) => {
                    const created = (r as any).createdAt ?? (r as any).created_at ?? null;
                    const createdStr = created ? new Date(created).toLocaleDateString() : undefined;

                    return (
                        <ListItemButton
                            key={idx}
                            selected={selectedIndex === idx}
                            onClick={() => onSelect(idx)}
                            sx={{
                                alignItems: 'center',
                                mb: 2,
                                bgcolor: 'background.paper', // give each item its own background
                                borderRadius: 5,
                                boxShadow: 0,
                                '&.Mui-selected': {
                                    bgcolor: 'action.selected',
                                },
                                mx: 0,
                                px: 2,
                                py: 1.5,
                            }}
                        >
                            <ListItemAvatar>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                    {getCategoryIcon(r.category)}
                                </Avatar>
                            </ListItemAvatar>

                            <ListItemText
                                primary={
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                        {r.title}
                                    </Typography>
                                }
                                secondary={
                                        <Typography variant="body2" color="text.secondary">
                                            {createdStr ?? r.user?.username ?? "Reported by unknown"}
                                        </Typography>
                                }
                            />

                            <Chip
                                color={setStatusChipColor(r.status, r) as any}
                                sx={{ alignSelf: 'center' }}
                                label={r.status}
                                size="small"
                            />
                        </ListItemButton>
                    );
                })}
            </List>
        </>
    );
}
