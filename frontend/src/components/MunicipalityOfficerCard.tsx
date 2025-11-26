import React from 'react';
import { Card, Typography, Avatar, Button, Box, Chip } from '@mui/material';
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
    const hasRole = user.role !== null && user.role !== undefined;
    
    function findRoleByTitle(role: string | null): React.ReactNode {
        const r = roles.find(r => r.title === role);
        return r ? r.label : role;
    }
    

    return (
        <Card
            sx={{
                width: '100%',
                // niente height: '100%' per evitare stretching verticale
                minHeight: 120,          // <- era 150
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 1.5,                 // <- più compatta
                p: 1.5,                   // <- padding ridotto
                borderRadius: 2,
                boxShadow: 3,
                transition: 'transform .2s, box-shadow .2s',
                '&:hover': { transform: 'translateY(-3px)', boxShadow: 6 },
                overflow: 'hidden',
            }}
        >
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48, fontSize: 18, flexShrink: 0, marginLeft: 2 }}>
                {initials}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0, marginLeft: 3}}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                    {user.username}
                </Typography>
                {hasRole ? (
                    <Chip
                        label={findRoleByTitle(user.role)}
                        size="small"
                        sx={{ mt: 1, maxWidth: '100%' }}
                        color="primary"
                        variant="outlined"
                    />
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
