import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, CircularProgress, Snackbar, Alert, Stack } from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useNavigate } from 'react-router-dom';
import { useConfirmEmail } from '../hook/authApi.hook';

export default function EmailConfirmationPage() {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const confirmEmail = useConfirmEmail();

    const INPUT_COUNT = 6; // generator creates 6-digit codes
    const [codeDigits, setCodeDigits] = useState<string[]>(new Array(INPUT_COUNT).fill(''));
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

    useEffect(() => {
        // keep `code` in sync with digit boxes
        setCode(codeDigits.join(''));
    }, [codeDigits]);

    const validateCode = (value: string) => {
        return /^\d{6}$/.test(value.trim());
    };

    // Handle single-digit input: allow '' or one digit, update codeDigits
    // immutably and focus the next input when appropriate.
    const handleDigitChange = (idx: number, val: string) => {
        if (!/^\d?$/.test(val)) return; // only allow single digit or empty
        setCodeDigits(prev => {
            const copy = [...prev];
            copy[idx] = val;
            return copy;
        });
        if (val && idx < INPUT_COUNT - 1) {
            inputsRef.current[idx + 1]?.focus();
        }
    };

    // Handle keyboard navigation (Arrow keys) and Backspace behavior for the OTP inputs
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
        const kc = e.key;
        if (kc === 'Backspace') {
            if (codeDigits[idx]) {
                // clear this box
                setCodeDigits(prev => {
                    const copy = [...prev];
                    copy[idx] = '';
                    return copy;
                });
            } else if (idx > 0) {
                // move focus to previous and clear it
                inputsRef.current[idx - 1]?.focus();
                setCodeDigits(prev => {
                    const copy = [...prev];
                    copy[idx - 1] = '';
                    return copy;
                });
            }
        }
        if (kc === 'ArrowLeft' && idx > 0) {
            inputsRef.current[idx - 1]?.focus();
        }
        if (kc === 'ArrowRight' && idx < INPUT_COUNT - 1) {
            inputsRef.current[idx + 1]?.focus();
        }
    };

    // Handle paste events on the OTP inputs:
    // - extract up to INPUT_COUNT numeric characters from the pasted text
    // - populate the digit inputs with those numbers
    // - focus the last filled input and prevent the default paste behavior
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const text = e.clipboardData.getData('text').trim();
        const digits = text.replaceAll(/\D/g, '');
        if (!digits) return;
        const arr = new Array(INPUT_COUNT).fill('');
        for (let i = 0; i < Math.min(digits.length, INPUT_COUNT); i++) arr[i] = digits[i];
        setCodeDigits(arr);
        const focusIdx = Math.min(digits.length, INPUT_COUNT) - 1;
        if (focusIdx >= 0) inputsRef.current[focusIdx]?.focus();
        e.preventDefault();
    };

    const handleSubmit = async () => {
        setError(null);
        if (!validateCode(code)) {
            setError('Enter the numeric confirmation code you received by email.');
            return;
        }
        setLoading(true);
        try {
            await confirmEmail.mutateAsync(code);

            setMessage('Email confirmed. Redirecting...');
            navigate('/', { replace: true });
        } catch (err: any) {
            console.error('Confirmation failed', err);
            const msg = err?.response?.data?.message ?? 'Failed to confirm code. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', p: 2 }}>
            <Paper sx={{ maxWidth: 600, width: '100%', p: { xs: 3, md: 5 }, borderRadius: 3 }} elevation={3}>
                <Stack spacing={4} alignItems="stretch">
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Box sx={{ bgcolor: 'primary.main', color: 'common.white', p: 1.25, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MailOutlineIcon fontSize="large" />
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>Confirm your email</Typography>
                            <Typography variant="body2" color="text.secondary">Enter the confirmation code we sent to your email address.</Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center'}} onPaste={handlePaste}>
                        {Array.from({ length: INPUT_COUNT }).map((_, i) => (
                            <TextField
                                key={i}
                                inputRef={el => inputsRef.current[i] = el}
                                value={codeDigits[i]}
                                color='primary'
                                onChange={(e) => handleDigitChange(i, e.target.value.replaceAll(/\D/g, ''))}
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(e, i)}
                                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 1, style: { textAlign: 'center', fontSize: 20 } }}
                                variant="outlined"
                                sx={{ width: { xs: 36, sm: 48 }, '& input': { p: 1 } }}
                                error={!!error}
                            />
                        ))}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                            disabled={loading || !validateCode(code)}
                            startIcon={loading ? undefined : <CheckCircleOutlineIcon />}
                        >
                            {loading ? <CircularProgress size={20} color="inherit" /> : 'Confirm email'}
                        </Button>
                    </Box>

                </Stack>

                <Snackbar open={!!message} autoHideDuration={4000} onClose={() => setMessage(null)}>
                    <Alert severity="success" onClose={() => setMessage(null)} sx={{ width: '100%' }}>{message}</Alert>
                </Snackbar>
            </Paper>
        </Box>
    );
}
