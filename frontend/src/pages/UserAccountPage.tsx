import {
    Box,
    Card,
    Container,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
    IconButton,
    Avatar,
    Button
} from "@mui/material";
import React, {useState} from "react";
import {useAuth} from "../contexts/AuthContext";
import {getInitials} from "../utils/stringUtilis";
import {AddAPhotoOutlined, MailOutline, Telegram} from "@mui/icons-material";
import {NotificationCard} from "../components/NotificationCard";
import {EmailTelegramCard} from "../components/EmailTelegramCard";

export const UserAccountPage: React.FC = () => {
    const {user} = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [telegramUsername, setTelegramUsername] = useState(user?.telegram_id)
    const [emailFlag, setEmailFlag] = useState(user?.flag_email || false)

    // Controllo se qualcosa è stato modificato
    const isModified = telegramUsername !== user?.telegram_id || emailFlag !== user?.flag_email;


    if (!user) return <Typography>Error</Typography>;

    return (
        <Container maxWidth="md" sx={{minHeight: "100vh", pt: {xs: 2, sm: 4}, pb: 5}}>

            {/* Titolo Profilo */}
            <Typography variant="h4" color="primary"
                        sx={{fontWeight: 800, fontSize: isMobile ? '1.5rem' : '2rem', mb: 4}}>
                Profile
            </Typography>

            {/* Blocco principale: avatar + nome + username */}
            <Card
                sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 4,
                    borderRadius: 3,
                    boxShadow: 3,
                    gap: 4,
                    mb: 4
                }}
            >
                {/* Avatar */}
                <Box sx={{position: "relative"}}>
                    <Avatar
                        src={user.photo || undefined}
                        sx={{
                            width: 80,
                            height: 80,
                            bgcolor: !user.photo ? "secondary.main" : "transparent",
                            fontSize: 30,
                            fontWeight: 600
                        }}
                    >
                        {!user.photo && getInitials(user.first_name, user.last_name, user.username)}
                    </Avatar>
                    <IconButton
                        onClick={() => {
                        }}
                        sx={{
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            width: 28,
                            height: 28,
                            bgcolor: "primary.main",
                            color: "white",
                            "&:hover": {bgcolor: "primary.dark"},
                            boxShadow: 2
                        }}
                    >
                        <AddAPhotoOutlined sx={{fontSize: 16}}/>
                    </IconButton>
                </Box>

                {/* Nome + username */}
                <Box sx={{display: "flex", flexDirection: "column"}}>
                    <Typography sx={{fontWeight: 700, fontSize: isMobile ? "1rem" : "1.3rem", color: "text.primary"}}>
                        {user.first_name} {user.last_name}
                    </Typography>
                    <Typography sx={{fontWeight: 400, fontSize: isMobile ? "0.9rem" : "1rem", color: "text.secondary"}}>
                        @{user.username}
                    </Typography>
                </Box>
            </Card>

            {/* Blocco Email + Telegram */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    gap: 4,
                    mb: 4
                }}
            >
                {/* Card Email */}
                <EmailTelegramCard user={user} type={"email"}/>

                {/* Card Telegram */}
                <EmailTelegramCard user={user}
                                   status={telegramUsername}
                                   type={"telegram"}
                                   onChange={(val) => setTelegramUsername(val)}
                />
            </Box>

            {/* Titolo Notifications */}
            <Typography variant="h4" color="primary"
                        sx={{fontWeight: 800, fontSize: isMobile ? '1.5rem' : '2rem', mb: 4}}>
                Notification Preferences
            </Typography>

            {/* Card notifiche */}
            <NotificationCard onChange={(val) => setEmailFlag(val)} emailFlag={emailFlag}/>

            {/* Card Salva modifiche */}
            {isModified && (
                <Card sx={{
                    mt: 4,
                    p: 3,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 2,
                    boxShadow: 3,
                    borderRadius: 3
                }}>
                    <Button
                        className="partecipation-button"
                        variant="outlined"
                        color="secondary"
                        onClick={() => {
                            setTelegramUsername(user.telegram_id || "");
                            setEmailFlag(user?.flag_email || false);
                        }}>
                        Cancel
                    </Button>
                    <Button
                        className="partecipation-button"
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            // TODO: chiama API per salvare le modifiche
                            console.log("Salva telegram:", telegramUsername);
                            console.log("Salva notifiche:", emailFlag);
                        }}>
                        Save Changes
                    </Button>
                </Card>
            )}

        </Container>
    );
};
