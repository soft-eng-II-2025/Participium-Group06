import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, DialogContentText, Stack } from '@mui/material';

type ConfirmDialogProps = {
    open: boolean;
    title?: string;
    description?: React.ReactNode;
    itemLabel?: React.ReactNode;
    onClose: () => void;
    onConfirm: () => void;
    loading?: boolean;
    confirmText?: string;
    cancelText?: string;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    title = 'Confirm',
    description,
    itemLabel,
    onClose,
    onConfirm,
    loading = false,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
}) => {
    return (
        <Dialog
            open={open}
            onClose={() => {
                if (!loading) onClose();
            }}
            aria-labelledby="confirm-dialog-title"
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle id="confirm-dialog-title" color="primary.main" sx={{ fontSize: 25, pb: 3, fontWeight: 700 }}>{title}</DialogTitle>
            <DialogContent>
                <Stack spacing={1}>
                    {description && (
                        typeof description === 'string' ? (
                            <DialogContentText sx={{ fontSize: 15, color: 'text.primary' }}>{description}</DialogContentText>
                        ) : (
                            <div>{description}</div>
                        )
                    )}

                    {itemLabel && (
                        <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 700 }}>
                            {itemLabel}
                        </Typography>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading} sx={{ textTransform: 'none' }}>{cancelText}</Button>
                <Button onClick={onConfirm} color="primary" variant="contained" disabled={loading} sx={{ textTransform: 'none', boxShadow: 3 }}>
                    {loading ? `${confirmText}…` : confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
