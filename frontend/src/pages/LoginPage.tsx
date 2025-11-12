import React, { useState } from "react";
import {
    Container,
    Paper,
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    Link,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import { useAuth } from "../contexts/AuthContext";
import { MunicipalityOfficerResponseDTO } from "../DTOs/MunicipalityOfficerResponseDTO";
import { UserResponseDTO } from "../DTOs/UserResponseDTO";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

    const validate = () => {
        if (!username || !password) {
            setError("Insert Username and Password.");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!validate()) return;

    setLoading(true);
    try {
        const user = await login({ username, password }) as UserDTO | MunicipalityOfficerDTO | null;
        navigate("/");
    } catch (err) {
      console.error(err);
      setError("An error occured during login. Try again.");
    } finally {
      setLoading(false);
    }
  };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    minHeight: "calc(100vh - 72px)",
                    display: "grid",
                    alignContent: "start", // in alto
                    pt: { xs: 2, md: 3 },
                    pb: 6,
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        width: "100%",
                        maxWidth: 520,
                        mx: "auto",
                        borderRadius: 2,
                        textAlign: "center",
                    }}
                >
                    <Box component="form" onSubmit={handleSubmit} sx={{ p: 4 }}>
                        <Typography variant="h4" component="h1" color="secondary" gutterBottom sx={{ fontWeight: 800 }}>
                            Login
                        </Typography>

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <TextField
                            label="Username"
                            type="text"
                            fullWidth
                            margin="normal"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <TextField
                            label="Password"
                            type="password"
                            fullWidth
                            margin="normal"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            color="secondary"
                            className="partecipation-button"
                            disabled={loading}
                            sx={{ mt: 3, py: 1.5, fontWeight: 600, px: 8 }}
                        >
                            {loading ? "Logging in..." : "Log in"}
                        </Button>

                        <Box sx={{ mt: 2, textAlign: "center" }}>
                            <Typography variant="body2">
                                You don't have an account?{" "}
                                <Link href="/register" underline="hover" sx={{ fontWeight: 600 }} color="secondary">
                                    Register now
                                </Link>
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default LoginPage;
