// src/components/UserCard.tsx
import React from 'react';
import {Card, CardContent, Typography, Avatar, Button, Box, Chip} from '@mui/material';
import {MunicipalityOfficerDTO} from "../DTOs/MunicipalityOfficerDTO";

interface UserCardProps {
    user: MunicipalityOfficerDTO;
    onEditRole: (username: string) => void;
}


function stringAvatar(name: string) {
    return {
        children: `${name.split(' ')[0][0]}${name.split(' ')[1][0]}`,
    };
}

export const UserCard: React.FC<UserCardProps> = ({user, onEditRole}) => {

    return (
        <Card
            sx={{
                width: '100%',
                maxWidth: 400,
                minHeight: 120,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                p: 2,
                borderRadius: 2,
                boxShadow: 3,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: 6,
                },
            }}
        >
            {/* Avatar */}
            <Avatar
                sx={{
                    bgcolor: "primary.main",
                    width: 60,
                    height: 60,
                    fontSize: 24,
                    mr: 2,
                    flexShrink: 0,
                }}
                {...stringAvatar(`${user.first_name} ${user.last_name}`)}
            />

            {/* Username + role/button */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    ml: 4,
                    minWidth: 0,
                }}
            >
                <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 1 }}
                >
                    {user.username}
                </Typography>

                {user.role ? (
                    <Chip
                        label={user.role.title}
                        size="medium"
                        sx={{
                            width: 120,
                            height: 32,
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.95rem',
                        }}
                        color="primary"
                        variant="outlined"
                    />
                ) : (
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => onEditRole(user.username)}
                        sx={{ mt: 1, width: 130 }}
                    >
                        Assign role
                    </Button>
                )}
            </Box>
        </Card>
    );
};