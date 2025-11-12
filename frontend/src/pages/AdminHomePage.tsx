import {useNavigate} from "react-router-dom";
import {Box, Typography, Grid, Container} from "@mui/material";
import React, { useState } from "react";
import {MunicipalityOfficerDTO} from "../DTOs/MunicipalityOfficerDTO";
import {UserCard} from "../components/MunicipalityOfficerCard";
import Button from "@mui/material/Button";
import AddIcon from '@mui/icons-material/Add';
import {useGetAllMunicipalityUsers} from "../hook/adminApi.hook";
import AssignRoleDialog from "../components/AssignRoleDialog";

const AdminHomePage = () => {
    const navigate = useNavigate();
    const { data: users = [], isLoading, isError } = useGetAllMunicipalityUsers();

    const [open, setOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<MunicipalityOfficerDTO | null>(null);

    if (isLoading) return <Typography>Loading users...</Typography>;
    if (isError)   return <Typography color="error">Errore nel caricamento degli utenti.</Typography>;

    const handleEditRole = (username: string) => {
        const u = (users || []).find((x: MunicipalityOfficerDTO) => x.username === username) || null;
        if (!u) return;
        if (u.role) return; // già assegnato
        setSelectedUser(u);
        setOpen(true);
    };

    const handleAddAccount = () => {
        navigate("/admin/register");
    };

    return (
        <Container maxWidth="xl" sx={{ minHeight: "100vh", pt: { xs: 2, sm: 4 }, pb: 5 }}>
            <Box sx={{ width: "100%", display: "flex", alignItems: "center", mb: 4, gap: 4 }}>
                <Typography variant="h4" component="h1" color="primary" sx={{ fontWeight: 800 }}>
                    Manage Account
                </Typography>

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddAccount}
                    sx={{
                        px: 3, py: 1, fontWeight: 600, borderRadius: 2, boxShadow: 3,
                        textTransform: "none", fontSize: "1rem", "&:hover": { boxShadow: 6 }
                    }}
                >
                    Add Account
                </Button>
            </Box>

            <Grid container spacing={6}>
                {(users || [])
                    .sort((a, b) => a.username.localeCompare(b.username))
                    .map((user) => (
                        <Grid item xs={12} sm={6} md={3} lg={3} xl={3} key={user.username}>
                            <UserCard user={user} onEditRole={handleEditRole} />
                        </Grid>
                    ))}
            </Grid>

            <AssignRoleDialog
                open={open}
                user={selectedUser}
                onClose={() => { setOpen(false); setSelectedUser(null); }}
            />
        </Container>
    );
};

export default AdminHomePage;
