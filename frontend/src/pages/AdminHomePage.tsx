import {useNavigate} from "react-router-dom";
import {Box, Typography, Grid, Container} from "@mui/material";
import React from "react"; // Rimosso useState non usato
import {MunicipalityOfficerDTO} from "../DTOs/MunicipalityOfficerDTO";
import {UserCard} from "../components/MunicipalityOfficerCard";
import Button from "@mui/material/Button";
import AddIcon from '@mui/icons-material/Add';
import {useGetAllMunicipalityUsers} from "../hook/adminApi.hook";


const AdminHomePage = () => {

    const navigate = useNavigate();
    const {data: users = [], isLoading, isError} = useGetAllMunicipalityUsers();

    if (isLoading) {
        return <Typography>Loading users...</Typography>;
    }

    if (isError) {
        return <Typography color="error">Errore nel caricamento degli utenti.</Typography>;
    }

    const handleEditRole = (username: string) => {
        console.log(`Apri modale per utente: ${username}`);
    };
    const handleAddAccount = () => {
        navigate("/admin/register")
    };


    return (
        <Container
            maxWidth="xl"
            sx={{
                minHeight: "100vh",
                pt: { xs: 2, sm: 4 },
                pb: 5,
            }}
        >

            <Box
                sx={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    mb: 4,
                    gap: 4,
                }}
            >
                <Typography
                    variant="h4"
                    component="h1"
                    color="primary"
                    sx={{fontWeight: 800}}
                >
                    Manage Account
                </Typography>

                <Button
                    variant="contained"
                    startIcon={<AddIcon/>}
                    onClick={handleAddAccount}
                    sx={{
                        px: 3, py: 1, fontWeight: 600, borderRadius: 2, boxShadow: 3,
                        textTransform: "none", fontSize: "1rem",
                        "&:hover": { boxShadow: 6, },
                    }}
                >
                    Add Account
                </Button>
            </Box>

            <Grid
                container
                spacing={4}
                justifyContent="flex-start"
            >
                {(users || [])
                    .sort((a: MunicipalityOfficerDTO, b: MunicipalityOfficerDTO) => a.username.localeCompare(b.username))
                    .map((user: MunicipalityOfficerDTO) => (
                        <Grid
                            item
                            xs={12}
                            sm={6}
                            md={4}
                            lg={3}
                            key={user.username}
                            sx={{ display: "flex", justifyContent: "center" }}
                        >
                            <UserCard user={user} onEditRole={handleEditRole} />
                        </Grid>
                    ))}
            </Grid>
        </Container>
    )
}

export default AdminHomePage;