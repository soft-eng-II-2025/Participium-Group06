import React, {useEffect, useMemo, useState} from "react";
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
    Typography,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import {useGetRoles, useSetRole} from "../hook/adminApi.hook";
import {useQueryClient} from "@tanstack/react-query";
import {AssignRoleRequestDTO} from "../DTOs/AssignRoleRequestDTO";
import Switch from '@mui/material/Switch';

type Props = {
    open: boolean;
    user: AssignRoleRequestDTO | null;
    onClose: () => void;
};

export default function AssignRoleDialog({open, user, onClose}: Props) {
    // v5: isPending (non isLoading)
    const {data: roles = [], isPending: rolesPending, isError: rolesError} = useGetRoles();
    const setRoleMut = useSetRole();
    const qc = useQueryClient();

    const currentTitle = user?.roleTitle ?? "";
    const [selectedTitle, setSelectedTitle] = useState<string>(currentTitle);
    const [confirmStep, setConfirmStep] = useState(false);
    const [external, setExternal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
    const partnerCompanies = ["a", "b", "c"];
    const filteredRoles = useMemo(() => {
        if (!external) return roles;
        return roles.filter(r =>
            r.label?.toLowerCase().includes("agent")
        );
    }, [roles, external]);


    useEffect(() => {
        setSelectedTitle(user?.roleTitle ?? "");
        setConfirmStep(false);
        setExternal(false);
        setSelectedCompany(null);
    }, [open, user]);


    const handleExternalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newExternal = event.target.checked;
        setExternal(newExternal);
        setSelectedTitle("");
        setSelectedCompany(null);
    };
    const unchanged = useMemo(
        () => (selectedTitle || "") === (currentTitle || ""),
        [selectedTitle, currentTitle]
    );

    const canConfirm =
        !!user &&
        !!selectedTitle &&
        !unchanged &&
        !setRoleMut.isPending &&
        !rolesPending &&
        (external ? !!selectedCompany : true);

    const onConfirm = () => {
        if (!user || !selectedTitle) return;
        if (!confirmStep) {
            setConfirmStep(true);
            return;
        }
        const payload: AssignRoleRequestDTO = {
            username: user.username,
            roleTitle: selectedTitle,
            external: external,
            companyName: selectedCompany
        };
        setRoleMut.mutate(payload, {
            onSuccess: () => {
                qc.invalidateQueries({queryKey: ["officers"]});
                onClose();
            },
        });
    };

    const onCancel = () => {
        if (setRoleMut.isPending) return;
        onClose();
    };

    return (
        <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs" PaperProps={{
            // Stile per aumentare l'elevazione e gli angoli arrotondati (come nell'immagine)
            sx: {borderRadius: 2}
        }}>
            <DialogTitle sx={{ fontWeight: 'bold' }}>
                Assign a role to the account
            </DialogTitle>
            <DialogContent>
                {user ? (
                    <Box sx={{mt: 1}}>
                        {/*<Box sx={{display: "flex", alignItems: "center", gap: 2, mb: 1}}>*/}
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                Account: <strong>{user.username}</strong>
                            </Typography>

                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    py: 1,
                                    borderBottom: "1px solid",
                                    borderColor: "divider",
                                    mb: 1
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: "0.85rem",
                                        fontWeight: 500,
                                        opacity: 0.9,
                                    }}
                                >
                                    External Maintainer
                                </Typography>

                                <Switch
                                    checked={external}
                                    onChange={handleExternalChange}
                                    name="external"
                                    size="small"
                                />
                            </Box>

                        {/*</Box>*/}

                        {/* SELECT COMPANY */}
                        {external && <FormControl
                          fullWidth
                          sx={{mt: 2}}
                        >
                          <Autocomplete
                            options={partnerCompanies}
                            value={selectedCompany ?? undefined}
                            onChange={(_, v) => setSelectedCompany(v)}
                            disableClearable
                            renderInput={(params) => (
                                <TextField {...params} label="Select company…" size="medium"/>
                            )}
                          />
                        </FormControl>

                        }

                        <FormControl
                            fullWidth
                            disabled={rolesPending || setRoleMut.isPending}
                            sx={{mt: 2}}
                        >
                            <Autocomplete
                                key={external ? 'external-roles' : 'internal-roles'}
                                options={filteredRoles}
                                getOptionLabel={(opt) => opt.label ?? ""}
                                value={filteredRoles.find(r => r.title === selectedTitle) ?? undefined}
                                onChange={(_, v) => setSelectedTitle(v?.title ?? "")}
                                isOptionEqualToValue={(o, v) => o.title === v.title}
                                disableClearable
                                renderInput={(params) => (
                                    <TextField {...params} label="Select role…" size="medium"/>
                                )}
                            />
                        </FormControl>

                        {rolesError && (
                            <Alert severity="error" sx={{mt: 2}}>
                                Failed to load roles.
                            </Alert>
                        )}

                        {confirmStep && (
                            <Alert severity="info" sx={{mt: 2}}>
                                Once assigned, the role <strong>cannot be modified</strong>.
                                Click <strong>Confirm</strong> again to proceed.
                            </Alert>
                        )}

                        {setRoleMut.isError && (
                            <Alert severity="error" sx={{mt: 2}}>
                                Role assignment failed. The user might already have a role or the role was not found.
                            </Alert>
                        )}
                    </Box>
                ) : (
                    <Typography sx={{mt: 1}}>No user selected.</Typography>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onCancel} disabled={setRoleMut.isPending}>
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color="primary"
                    disabled={!canConfirm}
                    startIcon={setRoleMut.isPending ? <CircularProgress size={18}/> : undefined}
                >
                    {setRoleMut.isPending ? "Saving..." : "Confirm"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
