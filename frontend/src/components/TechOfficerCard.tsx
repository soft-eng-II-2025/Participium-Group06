import React from 'react';
import { Card, CardContent, Box, Typography, CardActionArea } from '@mui/material';
import { getInitials } from '../utils/stringUtilis';

export type TechOfficer = {
    userId?: number;
    username: string;
    first_name?: string;
    last_name?: string;
};

type Props = {
    user: TechOfficer;
    sx?: any;
    className?: string;
    onClick?: () => void;
    selected?: boolean;
};

const TechOfficerCard: React.FC<Props> = ({ user, sx, className, onClick, selected = false }) => {
    const initials = getInitials(user.first_name ?? '', user?.last_name ?? '', user?.username ?? '');

    return (
        <Card
            sx={{
                width: '100%',
                p: 0,
                borderRadius: 4,
                transition: 'box-shadow 200ms, border-color 200ms',
                // only show a border when selected
                border: selected ? '2px solid' : 'none',
                borderColor: selected ? 'secondary.main' : undefined,
                '&:hover': onClick ? { boxShadow: 2 } : {},
                ...sx,
            }}
            className={className}
        >
            <CardActionArea onClick={onClick} disabled={!onClick} sx={{ borderRadius: 4 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'secondary.main', color: 'common.white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                        {initials}
                    </Box>
                    <Box sx={{ overflow: 'hidden' }}>
                        <Typography sx={{ fontWeight: 600, fontSize: 13 }} noWrap>
                            {user.first_name} {user.last_name}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: 'text.secondary' }} noWrap>
                            @{user.username}
                        </Typography>
                    </Box>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default TechOfficerCard;