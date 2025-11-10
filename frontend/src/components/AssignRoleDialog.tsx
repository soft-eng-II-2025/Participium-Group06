import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Typography,
} from "@mui/material";
import { MunicipalityOfficerDTO } from "../DTOs/MunicipalityOfficerDTO";
import { RoleDTO } from "../DTOs/RoleDTO";
import { useGetRoles, useSetRole } from "../hook/adminApi.hook";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
    open: boolean;
    user: MunicipalityOfficerDTO | null;
    onClose: () => void;
};

export default function AssignRoleDialog({ open, user, onClose }: Props) {
    // v5: isPending (non isLoading)
    const { data: roles = [], isPending: rolesPending, isError: rolesError } = useGetRoles();
    const setRoleMut = useSetRole();
    const qc = useQueryClient();

    const currentTitle = user?.role?.title ?? "";
    const [selectedTitle, setSelectedTitle] = useState<string>(currentTitle);
    const [confirmStep, setConfirmStep] = useState(false);

    useEffect(() => {
        setSelectedTitle(user?.role?.title ?? "");
        setConfirmStep(false);
    }, [open, user]);

    const unchanged = useMemo(
        () => (selectedTitle || "") === (currentTitle || ""),
        [selectedTitle, currentTitle]
    );

    const canConfirm =
        !!user &&
        !!selectedTitle &&
        !unchanged &&
        !setRoleMut.isPending &&
        !rolesPending;

    const onConfirm = () => {
        if (!user || !selectedTitle) return;
        if (!confirmStep) {
            setConfirmStep(true);
            return;
        }
        const payload: MunicipalityOfficerDTO = {
            ...user,
            role: { title: selectedTitle } as RoleDTO,
        };
        setRoleMut.mutate(payload, {
            onSuccess: () => {
                qc.invalidateQueries({ queryKey: ["officers"] });
                onClose();
            },
        });
    };

    const onCancel = () => {
        if (setRoleMut.isPending) return;
        onClose();
    };

    return (
        <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs">
            <DialogTitle>Assign a role to the account</DialogTitle>
            <DialogContent>
                {user ? (
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Account: <strong>{user.username}</strong>
                        </Typography>

                        <FormControl fullWidth disabled={rolesPending || setRoleMut.isPending}>
                            <InputLabel id="role-label">Select role…</InputLabel>
                            <Select
                                labelId="role-label"
                                label="Select role…"
                                value={selectedTitle}
                                onChange={(e) => {
                                    setSelectedTitle(e.target.value as string);
                                    setConfirmStep(false);
                                }}
                            >
                                {roles.map((r) => (
                                    <MenuItem key={r.title} value={r.title}>
                                        {r.title}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {rolesError && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                Failed to load roles.
                            </Alert>
                        )}

                        {confirmStep && (
                            <Alert severity="warning" sx={{ mt: 2 }}>
                                Once assigned, the role <strong>cannot be modified</strong>.
                                Click <strong>Confirm</strong> again to proceed.
                            </Alert>
                        )}

                        {setRoleMut.isError && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                Role assignment failed. The user might already have a role or the role was not found.
                            </Alert>
                        )}
                    </Box>
                ) : (
                    <Typography sx={{ mt: 1 }}>No user selected.</Typography>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onCancel} disabled={setRoleMut.isPending}>
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color={confirmStep ? "error" : "primary"}
                    disabled={!canConfirm}
                    startIcon={setRoleMut.isPending ? <CircularProgress size={18} /> : undefined}
                >
                    {setRoleMut.isPending ? "Saving..." : "Confirm"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
