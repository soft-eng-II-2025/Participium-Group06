import {
    Box,
    Card,
    Container,
    Typography,
    useMediaQuery,
    useTheme,
    IconButton,
    Avatar,
    Button, CircularProgress
} from "@mui/material";
import React, { useRef, useState} from "react";
import {useAuth} from "../contexts/AuthContext";
import {getInitials} from "../utils/stringUtilis";
import {AddAPhotoOutlined} from "@mui/icons-material";
import {NotificationCard} from "../components/NotificationCard";
import {EmailTelegramCard} from "../components/EmailTelegramCard";
import {useUserProfileUpdate} from "../hook/userApi.hook";

export const UserAccountPage: React.FC = () => {
    const {user} = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const {mutateAsync: updateProfile, isError, isPending} = useUserProfileUpdate();
    const [telegramUsername, setTelegramUsername] = useState(user?.telegram_id ?? undefined)
    const [emailFlag, setEmailFlag] = useState(user?.flag_email || false)
    const [photo, setPhoto] = useState(user && `http://localhost:3000/api/users/uploads/${user.photo}`)
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isModified, setIsModified] = useState(false);




    if (!user) return <Typography>Error</Typography>;


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);

        // Mostra anteprima subito
        setPhoto(previewUrl);
        setIsModified(true);
        // Salva file per l'upload
        setSelectedFile(file);
        e.target.value = "";
    };


    const handleSave = async () => {

        if (!isModified) return;


        try {
            const formData = new FormData();

            if (selectedFile) {
                formData.append("photo", selectedFile); // il campo deve corrispondere a multer
            }

            formData.append("telegram_id", telegramUsername || "");
            formData.append("flag_email", String(emailFlag));

            // Invia FormData al backend
            const updatedUser = await updateProfile(formData);
            if (updatedUser.photo) {
                setPhoto(`http://localhost:3000/api/users/uploads/${updatedUser.photo}`);
            }
            console.log("Profilo aggiornato con successo");

            // Dopo il salvataggio, resetto il selectedFile
            setSelectedFile(null);
            setIsModified(false)

        } catch (err) {
            console.error("Errore aggiornamento profilo:", err);
        }

    }

    return (
        <>
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
                            src={photo || undefined}
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
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{display: "none"}}
                            onChange={handleFileChange}
                        />

                        <IconButton
                            onClick={() => fileInputRef.current?.click()}
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
                        <Typography
                            sx={{fontWeight: 700, fontSize: isMobile ? "1rem" : "1.3rem", color: "text.primary"}}>
                            {user.first_name} {user.last_name}
                        </Typography>
                        <Typography
                            sx={{fontWeight: 400, fontSize: isMobile ? "0.9rem" : "1rem", color: "text.secondary"}}>
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
                                       onChange={(val) => {
                                           setTelegramUsername(val)
                                           setIsModified(true)
                                       }}
                    />
                </Box>

                {/* Titolo Notifications */}
                <Typography variant="h4" color="primary"
                            sx={{fontWeight: 800, fontSize: isMobile ? '1.5rem' : '2rem', mb: 4}}>
                    Notification Preferences
                </Typography>

                {/* Card notifiche */}
                <NotificationCard onChange={(val) => {
                    setEmailFlag(val)
                    setIsModified(true)
                }} emailFlag={emailFlag}/>

                {/* Mostra eventuale errore della mutation */}
                {isError && (
                    <Typography color="error" sx={{mt: 2}}>
                        Error updating profile
                    </Typography>
                )}

            </Container>
            {/* Card Salva modifiche */}
            {isModified && (
                <Card sx={{
                    mt: 4,
                    p: 3,
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    justifyContent: "center",
                    gap: 2,
                    boxShadow: 3,
                    borderRadius: 3,
                    position: "absolute",
                    bottom: 0,
                    width: "100%"
                }}>
                    <Button
                        className="partecipation-button"
                        variant="outlined"
                        color="secondary"
                        onClick={() => {
                            setTelegramUsername(user.telegram_id || "");
                            setEmailFlag(user?.flag_email || false);
                            setPhoto(user && `http://localhost:3000/api/users/uploads/${user.photo}`)
                            setIsModified(false)
                        }}>
                        Cancel
                    </Button>
                    <Button
                        className="partecipation-button"
                        variant="contained"
                        color="primary"
                        onClick={handleSave}

                    >
                        {isPending ? <CircularProgress size={22}/> : "Save Changes"}
                    </Button>
                </Card>
            )}
        </>
    );
};
