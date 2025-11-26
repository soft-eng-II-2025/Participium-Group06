// src/pages/AdminRegisterPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import RegistrationForm from "../components/RegistrationForm";
import { useRegisterMunicipalityOfficer } from "../hook/adminApi.hook";
import { MunicipalityOfficerResponseDTO } from "../DTOs/MunicipalityOfficerResponseDTO";
import { Container, Box } from "@mui/material";
import {CreateUserRequestDTO} from "../DTOs/CreateUserRequestDTO";

const AdminRegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { mutateAsync: registerMunicipalityOfficer, isPending, error } =
        useRegisterMunicipalityOfficer();

    const serverErrorMessage = error ? "Registration failed. Please try again." : null;

    const handleAdminRegister = async (payload: CreateUserRequestDTO) => {
        const res = await registerMunicipalityOfficer(payload);
        // Se il tuo hook non restituisce 'status', ti basta navigare su successo:
        if (!res || res.status === 201) navigate("/");
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    minHeight: "calc(100vh - 72px)", // altezza viewport meno AppBar
                    display: "grid",
                    alignContent: "start",           // ancora in alto
                    pt: { xs: 2, md: 3 },
                    pb: 6,
                }}
            >
                <RegistrationForm
                    title="Create municipality officer"
                    onSubmit={handleAdminRegister as any}
                    loading={isPending}
                    serverError={serverErrorMessage}
                    isAdmin={true}
                />
            </Box>
        </Container>
    );
};

export default AdminRegisterPage;
