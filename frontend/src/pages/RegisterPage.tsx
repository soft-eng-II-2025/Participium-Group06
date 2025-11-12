import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegisterUser } from "../hook/authApi.hook";
import RegistrationForm from "../components/RegistrationForm";
import { UserDTO } from "../DTOs/UserDTO";
import { Container, Box } from "@mui/material";

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const registerUser = useRegisterUser();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async (payload: UserDTO) => {
        setError(null);
        setLoading(true);
        try {
            await registerUser.mutateAsync(payload as any);
            navigate("/map");
        } catch (err) {
            setError("Registration failed. Please try again.");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    minHeight: "calc(100vh - 72px)", // sopra l'appbar
                    display: "grid",
                    alignContent: "start",           // ancora in alto
                    pt: { xs: 2, md: 3 },
                    pb: 6,
                }}
            >
                <RegistrationForm onSubmit={handleRegister} loading={loading} serverError={error} />
            </Box>
        </Container>
    );
};

export default RegisterPage;
