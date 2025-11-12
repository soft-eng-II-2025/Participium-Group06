import React, { useState } from "react";
import { Paper, Box, Typography, TextField, Button, Alert } from "@mui/material";
import { UserDTO } from "../DTOs/UserDTO";

type Props = {
    onSubmit: (payload: UserDTO) => Promise<void> | void;
    loading?: boolean;
    serverError?: string | null;
    title?: string;
};

const RegistrationForm: React.FC<Props> = ({
                                               onSubmit,
                                               loading = false,
                                               serverError = null,
                                               title = "Create your account",
                                           }) => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [localLoading, setLocalLoading] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const isLoading = loading || localLoading;

    const validate = () => {
        const u = username.trim();
        const e = email.trim();
        if (!u || !e || !password || !confirmPassword) {
            setLocalError("Please fill in all required fields.");
            return false;
        }
        const emailRe = /^\S+@\S+\.\S+$/;
        if (!emailRe.test(e)) {
            setLocalError("Please enter a valid email address.");
            return false;
        }
        if (password !== confirmPassword) {
            setLocalError("Passwords do not match.");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        if (!validate()) return;

        const payload: UserDTO = {
            username: username.trim(),
            email: email.trim(),
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            password,
        };

        try {
            setLocalLoading(true);
            await onSubmit(payload);
        } catch (err) {
            setLocalError((err as any)?.message ?? "Registration failed. Please try again.");
        } finally {
            setLocalLoading(false);
        }
    };

    return (
        <Paper
            elevation={3}
            sx={{
                width: "100%",
                maxWidth: 520,
                mx: "auto",        // centra orizzontalmente dentro il Container
                borderRadius: 2,
                textAlign: "center",
            }}
        >
            <Box component="form" onSubmit={handleSubmit} sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" color="primary" gutterBottom sx={{ fontWeight: 800 }}>
                    {title}
                </Typography>

                {localError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {localError}
                    </Alert>
                )}
                {serverError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {serverError}
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
                    autoComplete="username"
                />

                <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    margin="normal"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                />

                {/* Nome / Cognome responsivi */}
                <Box sx={{ display: "flex", gap: 2, mt: 1, mb: 1, flexWrap: "wrap" }}>
                    <TextField
                        label="First Name"
                        required
                        type="text"
                        sx={{ flex: 1, minWidth: 180 }}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        autoComplete="given-name"
                    />
                    <TextField
                        label="Last Name"
                        required
                        type="text"
                        sx={{ flex: 1, minWidth: 180 }}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        autoComplete="family-name"
                    />
                </Box>

                <TextField
                    label="Password"
                    type="password"
                    fullWidth
                    margin="normal"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                />

                <TextField
                    label="Confirm Password"
                    type="password"
                    fullWidth
                    margin="normal"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                />

                <Button
                    type="submit"
                    className="partecipation-button"
                    variant="contained"
                    color="primary"
                    disabled={isLoading}
                    sx={{ mt: 3, py: 1.25, px: 8, fontWeight: 800 }}
                >
                    {isLoading ? "Registering..." : "Register"}
                </Button>
            </Box>
        </Paper>
    );
};

export default RegistrationForm;
