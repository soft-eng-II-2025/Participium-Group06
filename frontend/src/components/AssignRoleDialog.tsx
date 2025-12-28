import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
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
import { useGetRoles, useSetRole } from "../hook/adminApi.hook";
import { useQueryClient } from "@tanstack/react-query";
import { AssignRoleRequestDTO } from "../DTOs/AssignRoleRequestDTO";
import { MunicipalityOfficerResponseDTO } from "../DTOs/MunicipalityOfficerResponseDTO";
import Switch from '@mui/material/Switch';

type Props = {
    open: boolean;
    user: MunicipalityOfficerResponseDTO | null;
    onClose: () => void;
};

export default function AssignRoleDialog({ open, user, onClose }: Props) {
    const { data: roles = [], isPending: rolesPending, isError: rolesError } = useGetRoles();
    const setRoleMut = useSetRole();
    const qc = useQueryClient();

    const currentRoles = useMemo(() => user?.roles ?? [], [user]);
    const [selectedRoles, setSelectedRoles] = useState<string[]>(currentRoles);
    const [external, setExternal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
    const partnerCompanies = ["GTT - Gruppo Trasporti Torinese", "Iren S.p.A.", "Amiat", "Italgas", "Enel X"];
    const filteredRoles = useMemo(() => {
        if (!external) return roles;
        return roles.filter(r =>
            r.label?.toLowerCase().includes("agent")
        );
    }, [roles, external]);


    useEffect(() => {
        setSelectedRoles(user?.roles ?? []);
        setExternal(user?.external ?? false);
        setSelectedCompany(user?.companyName ?? null);
    }, [open, user]);


    const handleExternalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newExternal = event.target.checked;
        setExternal(newExternal);
        setSelectedRoles([]);
        setSelectedCompany(null);
    };
    const unchanged = useMemo(() => {
        const curr = currentRoles || [];
        const sel = selectedRoles || [];
        if (curr.length !== sel.length) return false;
        const sortedCurr = [...curr].sort();
        const sortedSel = [...sel].sort();
        return sortedCurr.every((v, i) => v === sortedSel[i]);
    }, [currentRoles, selectedRoles]);

    const canConfirm =
        !!user &&
        selectedRoles.length > 0 &&
        !unchanged &&
        !setRoleMut.isPending &&
        !rolesPending &&
        (external ? !!selectedCompany : true);

    const onConfirm = () => {
        if (!user || selectedRoles.length === 0) return;
        const payload: AssignRoleRequestDTO = {
            username: user.username,
            rolesTitle: selectedRoles,
            external: external,
            companyName: selectedCompany
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
        <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs" PaperProps={{
            sx: { borderRadius: 2 },
        }}>
            <DialogTitle sx={{ fontWeight: 'bold' }}>
                Assign a role to the account
            </DialogTitle>
            <DialogContent>
                {user ? (
                    <Box sx={{ mt: 1 }}>
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
                            sx={{ mt: 2 }}
                        >
                            <Autocomplete
                                options={partnerCompanies}
                                value={selectedCompany ?? undefined}
                                onChange={(_, v) => setSelectedCompany(v)}
                                disableClearable
                                renderInput={(params) => (
                                    <TextField {...params} label="Select company…" size="medium" />
                                )}
                            />
                        </FormControl>

                        }

                        <FormControl fullWidth disabled={rolesPending || setRoleMut.isPending} sx={{ mt: 2 }}>
                            <Autocomplete
                                multiple
                                key={external ? 'external-roles' : 'internal-roles'}
                                options={filteredRoles}
                                getOptionLabel={(opt: any) => opt.label ?? opt.title}
                                value={filteredRoles.filter((r) => r.title != null && selectedRoles.includes(r.title))}
                                onChange={(_, v) =>
                                    setSelectedRoles(v.map((o: any) => o.title).filter((t: any): t is string => typeof t === 'string'))
                                }
                                isOptionEqualToValue={(o, v) => o.title === v.title}
                                disableCloseOnSelect
                                slotProps={{
                                    popper: {
                                        placement: 'top',
                                        sx: { mb: 1 }
                                    }
                                }}
                                renderTags={() => null}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Roles"
                                        placeholder={selectedRoles.length === 0 ? "Select roles" : ""}
                                        size="medium"
                                    />
                                )}
                            />

                            {selectedRoles.length > 0 && (
                                <Box sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 1,
                                    mt: 1.5,
                                    p: 1,
                                    borderRadius: 1,
                                    border: '1px dashed',
                                    borderColor: 'divider'
                                }}>
                                    {filteredRoles
                                        .filter((r) => r.title != null && selectedRoles.includes(r.title))
                                        .map((option: any) => (
                                            <Chip
                                                key={option.title}
                                                label={option.label}
                                                color="primary"
                                                variant="outlined"
                                                onDelete={() => setSelectedRoles(prev => prev.filter(t => t !== option.title))}
                                                sx={{
                                                    fontWeight: 500,
                                                    bgcolor: 'background.paper'
                                                }}
                                            />
                                        ))}
                                </Box>
                            )}
                        </FormControl>

                        {rolesError && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                Failed to load roles.
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
                    color="primary"
                    disabled={!canConfirm}
                    startIcon={setRoleMut.isPending ? <CircularProgress size={18} /> : undefined}
                >
                    {setRoleMut.isPending ? "Saving..." : "Confirm"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
