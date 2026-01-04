import React, { useState, useRef } from 'react';
import { Card, Typography, Avatar, Button, Box, Chip, Tooltip, IconButton } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import { MunicipalityOfficerResponseDTO } from "../DTOs/MunicipalityOfficerResponseDTO";
import { useGetRoles } from "../hook/adminApi.hook";


type UserCardProps = { user: MunicipalityOfficerResponseDTO; onEditRole: (username: string) => void; };

function getInitials(name: string) {
    const p = name.trim().split(/\s+/).filter(Boolean);
    if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return 'US';
}

export const UserCard: React.FC<UserCardProps> = ({ user, onEditRole }) => {
    const { data: roles = [] } = useGetRoles();
    const display = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.username;
    const initials = getInitials(display);
    const hasRole = user.roles !== null && user.roles !== undefined;

    const containerRef = useRef<HTMLDivElement | null>(null);
    const [expanded, setExpanded] = useState(false);

    if (!roles || roles.length === 0) return null;

    function findRoleByTitle(role: string | null): React.ReactNode {
        const r = roles.find(r => r.title === role);
        return r ? r.label : role;
    }

    return (
        <Card
            sx={{
                width: '100%',
                minHeight: 120,          // <- era 150
                height: '100%',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 1.5,                 // <- più compatta
                p: 1.5,                   // <- padding ridotto
                borderRadius: 2,
                boxShadow: 3,
                transition: 'transform .2s, box-shadow .2s',
                '& .edit-btn': {
                    opacity: 0,
                    visibility: 'hidden',
                    transform: 'translateY(-2px)',
                    transition: 'opacity .18s ease, transform .18s ease',
                },
                '&:hover': { transform: 'translateY(-3px)', boxShadow: 6 },
                '&:hover .edit-btn, & .edit-btn:focus, & .edit-btn:focus-visible': {
                    opacity: 1,
                    visibility: 'visible',
                    transform: 'translateY(0)'
                },
                overflow: 'hidden',
            }}
        >
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48, fontSize: 18, flexShrink: 0, marginLeft: 2 }}>
                {initials}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0, marginLeft: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                        {user.username}
                    </Typography>
                    <IconButton
                        className="edit-btn"
                        aria-label={`edit-${user.username}`}
                        size="small"
                        onClick={() => onEditRole(user.username)}
                        sx={{ ml: 1 }}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Box>
                {hasRole ? (
                    <Box sx={{ mt: 1, maxWidth: '100%' }}>
                        {/* Chip del Ruolo */}
                        <Box sx={{ display: 'flex', gap: 1, mb: user.external ? 0.5 : 0 }}>
                            <Box>
                                <Box
                                    ref={containerRef}
                                    sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 1,
                                        maxHeight: expanded ? 'none' : '100px',
                                        overflow: 'hidden',
                                        alignItems: 'center'
                                    }}
                                >
                                    {user.roles && (expanded ? user.roles : user.roles.slice(0, 2)).map((r, i) => (
                                        <Tooltip key={`${String(r)}-${i}`} title={String(findRoleByTitle(r))} placement="top">
                                            <Chip
                                                label={findRoleByTitle(r)}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                                sx={{ whiteSpace: 'nowrap', '& .MuiChip-label': { px: 1 } }}
                                            />
                                        </Tooltip>
                                    ))}
                                </Box>

                                {user.roles && user.roles.length > 2 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                                        <Button size="small" onClick={() => setExpanded((s) => !s)} sx={{ textTransform: 'none' }}>
                                            {expanded ? (
                                                <>
                                                    <ExpandLessIcon fontSize="small" sx={{ mr: 0.5 }} /> Show less
                                                </>
                                            ) : (
                                                <>
                                                    Show more <ExpandMoreIcon fontSize="small" sx={{ ml: 0.5 }} />
                                                </>
                                            )}
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        </Box>

                        {/* Informazione Azienda Esterna (Solo se esterno) */}
                        {user.external && (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    display: 'block',
                                    fontWeight: 'medium',
                                    fontStyle: 'italic',
                                    lineHeight: 1.2
                                }}
                            >
                                Partner: {user.companyName}
                            </Typography>
                        )}
                    </Box>
                ) : (
                    <Button
                        variant="contained"
                        color="secondary"
                        className="partecipation-button"
                        onClick={() => onEditRole(user.username)}
                        size="small"
                        sx={{ mt: 1, alignSelf: 'flex-start' }}
                    >
                        Assign role
                    </Button>
                )}
            </Box>
        </Card>
    );
};
