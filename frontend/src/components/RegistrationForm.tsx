import React, { useState } from "react";
import { Paper, Box, Typography, TextField, Button, Alert } from "@mui/material";
import { UserDTO } from "../types/user.types";

type Props = {
  onSubmit: (payload: UserDTO) => Promise<void> | void;
  loading?: boolean;
  serverError?: string | null;
  title?: string;
};

const RegistrationForm: React.FC<Props> = ({ onSubmit, loading = false, serverError = null, title = 'Create your account' }) => {
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
    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      setLocalError("Please fill in all required fields.");
      return false;
    }
    const emailRe = /^\S+@\S+\.\S+$/;
    if (!emailRe.test(email)) {
      setLocalError("Please enter a valid email address.");
      return false;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
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

    const payload: RegistrationPayload = {
      username,
      email,
      first_name: firstName,
      last_name: lastName,
      password,
    };

    try {
      setLocalLoading(true);
      await onSubmit(payload);
    } catch (err) {
      setLocalError((err as any)?.message ?? 'Registration failed. Please try again.');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <Box
          sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100vw" }}>
          <Paper elevation={3} sx={{ width: "100%", maxWidth: 520, borderRadius: "12px", textAlign: "center" }}>
            <Box component="form" onSubmit={handleSubmit} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" color="primary" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
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

          <Box sx={{ display: "flex", gap: 2, mt: 1, mb: 1, flexWrap: "wrap" }}>
            <TextField
              label="First Name"
              required
              type="text"
              sx={{ flex: 1, minWidth: 150 }}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
            <TextField
              label="Last Name"
              type="text"
              required
              sx={{ flex: 1, minWidth: 150 }}
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
            helperText="Minimum 6 characters"
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
    </Box>
  );
};

export default RegistrationForm;
