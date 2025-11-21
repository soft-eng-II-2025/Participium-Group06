import {Box, Card, TextField, Typography} from "@mui/material";
import {MailOutline, Telegram} from "@mui/icons-material";
import React, {useState} from "react";
import {UserResponseDTO} from "../DTOs/UserResponseDTO";

interface TelegramCardProps {
    user: UserResponseDTO;
    type: string;
    status?: string;
    onChange?: (value: string) => void; // opzionale per gestire aggiornamenti
}

export const EmailTelegramCard: React.FC<TelegramCardProps> = ({user, onChange, type, status}) => {

    const handleChange = (value: string) => {
        if (onChange) {
            onChange(value);
        }
    };

    return (
        <Card
            sx={{
                flex: 1,
                minHeight: 120,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                padding: 3,
                borderRadius: 3,
                boxShadow: 3,
                gap: 3,
            }}
        >
            {/* Icona */}
            <Box sx={{
                width: 50,
                height: 50,
                bgcolor: "#e0f2ff",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0088cc",
                boxShadow: 1
            }}>
                {type == "email" ? <MailOutline sx={{fontSize: 28}}/> : <Telegram sx={{fontSize: 28}}/>}
            </Box>

            {/* Testo */}
            <Box sx={{flex: 1}}>
                <Typography sx={{ fontSize: "0.9rem", color: "text.secondary" }}>
                    {type == "email" ? "Email" : "Telegram"}
                </Typography>
                <TextField
                    disabled={type == "email"}
                    value={type == "telegram" ? status || "" : user.email }
                    onChange={(e) => type === "telegram" && handleChange(e.target.value)}
                    placeholder={type == "telegram" ? "@telegram_username" : ""}
                    variant="filled"
                    InputProps={{
                        disableUnderline: true,
                        sx: {
                            bgcolor: "#f5f5f5",
                            borderRadius: 2,
                            fontSize: "1.1rem",
                            px: 2,
                            //py: 1.5
                        },
                    }}
                    fullWidth
                />
            </Box>
        </Card>

    )

}