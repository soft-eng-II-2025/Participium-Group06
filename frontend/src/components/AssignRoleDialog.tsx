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
    Switch,
    Autocomplete,
    TextField
} from "@mui/material";
import { useGetRoles, useSetRole } from "../hook/adminApi.hook";
import { useQueryClient } from "@tanstack/react-query";
import { AssignRoleRequestDTO } from "../DTOs/AssignRoleRequestDTO";
import { MunicipalityOfficerResponseDTO } from "../DTOs/MunicipalityOfficerResponseDTO";

type Props = {
    open: boolean;
    user: MunicipalityOfficerResponseDTO | null;
    onClose: () => void;
};

export default function AssignRoleDialog({ open, user, onClose }: Props) {
    const { data: roles = [], isPending: rolesPending, isError: rolesError } = useGetRoles();
    const setRoleMut = useSetRole();
    const qc = useQueryClient();

    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [external, setExternal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

    const partnerCompanies = ["GTT - Gruppo Trasporti Torinese", "Iren S.p.A.", "Amiat", "Italgas", "Enel X"];

    useEffect(() => {
        if (open && user) {
            setSelectedRoles(user.roles ?? []);
            setExternal(user.external ?? false);
            setSelectedCompany(user.companyName ?? null);
        }
    }, [open, user]);

    const filteredRoles = useMemo(() => {
        if (!external) return roles;
        return roles.filter(r => r.label?.toLowerCase().includes("agent"));
    }, [roles, external]);

    const isDataUnchanged = useMemo(() => {
        const currentRoles = user?.roles ?? [];
        
        const rolesMatch = 
            currentRoles.length === selectedRoles.length && 
            currentRoles.every(role => selectedRoles.includes(role));

        const metadataMatch = 
            external === (user?.external ?? false) && 
            selectedCompany === (user?.companyName ?? null);

        return rolesMatch && metadataMatch;
    }, [user, selectedRoles, external, selectedCompany]);

    const canConfirm =
        !!user &&
        !isDataUnchanged &&
        !setRoleMut.isPending &&
        !rolesPending &&
        (external ? !!selectedCompany : true);

    const handleExternalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setExternal(event.target.checked);
        setSelectedRoles([]);
        setSelectedCompany(null);
    };

    const onConfirm = () => {
        if (!user) return;
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

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ fontWeight: 'bold' }}>Assign a role to the account</DialogTitle>
            <DialogContent>
                {user ? (
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            Account: <strong>{user.username}</strong>
                        </Typography>

                        <Box sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            py: 1,
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            mb: 1
                        }}>
                            <Typography sx={{ fontSize: "0.85rem", fontWeight: 500, opacity: 0.9 }}>
                                External Maintainer
                            </Typography>
                            <Switch checked={external} onChange={handleExternalChange} size="small" />
                        </Box>

                        {external && (
                            <FormControl fullWidth sx={{ mt: 2 }}>
                                <Autocomplete
                                    options={partnerCompanies}
                                    value={selectedCompany ?? undefined}
                                    onChange={(_, v) => setSelectedCompany(v)}
                                    renderInput={(params) => <TextField {...params} label="Select company…" />}
                                />
                            </FormControl>
                        )}

                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <Autocomplete
                                multiple
                                key={external ? 'ext' : 'int'}
                                options={filteredRoles}
                                getOptionLabel={(opt: any) => opt.label ?? opt.title}
                                value={filteredRoles.filter((r) => r.title && selectedRoles.includes(r.title))}
                                onChange={(_, v) => setSelectedRoles(v.map((o: any) => o.title))}
                                disableCloseOnSelect
                                slotProps={{
                                    popper: {
                                        placement: 'top', // Forces the menu to open UPWARDS
                                        sx: { mb: 1 }
                                    }
                                }}
                                renderTags={() => null}
                                renderInput={(params) => (
                                    <TextField {...params} label="Roles" placeholder="Select roles" />
                                )}
                            />

                            {selectedRoles.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5, p: 1, borderRadius: 1, border: '1px dashed', borderColor: 'divider' }}>
                                    {filteredRoles
                                        .filter((r) => r.title && selectedRoles.includes(r.title))
                                        .map((option: any) => (
                                            <Chip
                                                key={option.title}
                                                label={option.label}
                                                color="primary"
                                                variant="outlined"
                                                onDelete={() => setSelectedRoles(prev => prev.filter(t => t !== option.title))}
                                                sx={{ bgcolor: 'background.paper', fontWeight: 500 }}
                                            />
                                        ))}
                                </Box>
                            )}
                        </FormControl>

                        {(rolesError || setRoleMut.isError) && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {rolesError ? "Failed to load roles." : "Role assignment failed."}
                            </Alert>
                        )}
                    </Box>
                ) : (
                    <Typography>No user selected.</Typography>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} disabled={setRoleMut.isPending}>Cancel</Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    disabled={!canConfirm}
                    startIcon={setRoleMut.isPending && <CircularProgress size={18} />}
                >
                    {setRoleMut.isPending ? "Saving..." : "Confirm"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}