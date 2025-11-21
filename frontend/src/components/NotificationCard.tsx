import {Box, Card, Typography, Switch, useMediaQuery, useTheme} from "@mui/material";
import React, {useState} from "react";
import {Notifications} from "@mui/icons-material";

interface NotificationCardProps {
    onChange?: (b: boolean) => void;
    emailFlag: boolean
}

export const NotificationCard: React.FC<NotificationCardProps> = ({onChange, emailFlag}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    //const [emailNotifications, setEmailNotifications] = useState(true);


    const handleChange = (b: boolean) => {
        if (onChange) {
            onChange(b); // chiama la funzione passata come prop se esiste
        }
    };
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 4,
                mb: 4,
            }}
        >
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
                <Box
                    sx={{
                        width: 50,
                        height: 50,
                        bgcolor: "#e0f2ff",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "primary.main",
                        boxShadow: 1,
                    }}
                >
                    <Notifications sx={{fontSize: 28}}/>
                </Box>

                {/* Contenuto */}
                <Box sx={{flex: 1, display: "flex", flexDirection: "column", gap: 0.5}}>
                    <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                        <Typography sx={{fontWeight: 500, fontSize: "1.1rem", color: "text.primary"}}>
                            Email Notifications
                        </Typography>
                        <Switch
                            checked={emailFlag}
                            onChange={() => handleChange(!emailFlag)}
                            color="primary"
                        />
                    </Box>
                    <Typography sx={{fontSize: "0.8rem", color: "text.secondary"}}>
                        Enable this option to receive notifications via email about important updates and alerts.
                    </Typography>
                </Box>
            </Card>
        </Box>
    );
};
