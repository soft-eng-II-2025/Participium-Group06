import React, { useState, useRef, useCallback, useEffect } from "react";
import { Box, Button, TextField, Grid, Typography, Paper, Select, MenuItem, IconButton, FormHelperText, CircularProgress, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useLocation, useNavigate } from "react-router-dom";
import { useAddReport, useUploadReportImages, useReportCategories } from "../hook/userApi.hook";
import { CreateReportDTO } from "../DTOs/CreateReportDTO";
import { CategoryResponseDTO } from "../DTOs/CategoryResponseDTO";
import { useAuth } from '../contexts/AuthContext';
import { StatusType } from "../DTOs/StatusType";

type FormState = {
  longitude: number | null;
  latitude: number | null;
  title: string;
  description: string;
  categoryId: number | "";
};

export default function NewReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const addReportMutation = useAddReport();
  const uploadImagesMutation = useUploadReportImages();
  const { data: categories, isLoading: isLoadingCategories, isError: isErrorCategories, error: categoriesError } = useReportCategories();

  const initialLatitude = (location.state as any)?.latitude ? Number((location.state as any).latitude) : null;
  const initialLongitude = (location.state as any)?.longitude ? Number((location.state as any).longitude) : null;

  const [form, setForm] = useState<FormState>({
    longitude: initialLongitude,
    latitude: initialLatitude,
    title: "",
    description: "",
    categoryId: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // --- STATI PER IL SNACKBAR ---
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [photos]);

  const onFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0) return;

    setPhotos((p) => {
      const newPhotos = [...p, ...arr];
      return newPhotos.slice(0, 3);
    });
  }, []);

  const handleDrop: React.DragEventHandler = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onFiles(e.dataTransfer.files);
  }, [onFiles]);

  const handleDragOver: React.DragEventHandler = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handlePickFiles = () => fileInputRef.current?.click();

  const handleRemovePhoto = (index: number) => {
    setPhotos((p) => p.filter((_, i) => i !== index));
  };

  const handleChange =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
      const val = e.target.value;
      if (key === "categoryId") {
        setForm((s) => ({ ...s, [key]: val === "" ? "" : Number(val) }));
      } else if (key === "longitude" || key === "latitude") {
        setForm((s) => ({ ...s, [key]: val === "" ? "" : Number(val) }));
      } else {
        setForm((s) => ({ ...s, [key]: val }));
      }
    };

  const validate = () => {
    if (!form.title) {
      setError("Title is required");
      return false;
    }
    if (!form.description) {
      setError("Description is required");
      return false;
    }
    if (form.latitude === null || form.longitude === null) {
      setError("Latitude and Longitude are required.");
      return false;
    }
    if (photos.length === 0) {
      setError("At least one photo is required.");
      return false;
    }
    if (form.categoryId === "" || form.categoryId === null) {
      setError("Category is required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSnackbarOpen(false);

    if (!validate()) return;

    let uploadedPhotoUrls: string[] = [];

    try {
      if (photos.length > 0) {
        uploadedPhotoUrls = await uploadImagesMutation.mutateAsync(photos);
      }
      if(!user) {
        throw new Error("User not authenticated");
      }


      const reportData: CreateReportDTO = {
        longitude: Number(form.longitude),
        latitude: Number(form.latitude),
        title: form.title,
        description: form.description,
        categoryId: Number(form.categoryId),
        user,
        status: StatusType.PendingApproval,
        explanation: "", 
        officer: undefined, // Empty officer object to be filled by backend
        photos: uploadedPhotoUrls,
      };

      await addReportMutation.mutateAsync(reportData);

      // show modal dialog for success, then redirect
      setSuccessDialogOpen(true);
      setTimeout(() => {
        setSuccessDialogOpen(false);
        navigate("/");
      }, 1200);

    } catch (err: any) {
      setError(err.message ?? "Failed to create report or upload images");
    }
  };

  const isSubmitting = addReportMutation.isPending || uploadImagesMutation.isPending;

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 72px)", width: "100%" }}>
      <Paper elevation={3} sx={{ width: "100%", maxWidth: 520, borderRadius: "12px", textAlign: "center", p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, color: 'secondary.main', pb: 4 }}>
          Create a New Report
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Longitude"
                type="number"
                value={form.longitude === null ? "" : form.longitude}
                onChange={handleChange("longitude")}
                fullWidth
                inputProps={{ step: "any" }}
                required
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Latitude"
                type="number"
                value={form.latitude === null ? "" : form.latitude}
                onChange={handleChange("latitude")}
                fullWidth
                inputProps={{ step: "any" }}
                required
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Title"
                value={form.title}
                onChange={handleChange("title")}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={form.description}
                onChange={handleChange("description")}
                fullWidth
                multiline
                rows={4}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Select
                displayEmpty
                value={form.categoryId === "" ? "" : form.categoryId}
                fullWidth
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    categoryId: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                disabled={isLoadingCategories}
                error={isErrorCategories || (error === "Category is required." && form.categoryId === "")}
              >
                {isLoadingCategories && (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} /> Loading Categories...
                  </MenuItem>
                )}
                {isErrorCategories && (
                  <MenuItem disabled>Error loading categories: {categoriesError?.message}</MenuItem>
                )}
                {/* Soluzione: Rimuovi il Fragment e rendi condizionalmente un array di MenuItem */}
                {!isLoadingCategories && !isErrorCategories && categories && (
                    [
                        <MenuItem key="select-category-placeholder" value="">
                            <em>Select a Category</em>
                        </MenuItem>,
                        ...categories.map((category: CategoryResponseDTO) => (
                            <MenuItem key={category.id} value={category.id}>
                                {category.name}
                            </MenuItem>
                        ))
                    ]
                )}
                {!isLoadingCategories && !isErrorCategories && (!categories || categories.length === 0) && (
                    <MenuItem disabled>No Categories Available</MenuItem>
                )}
              </Select>
              {(error === "Category is required." && form.categoryId === "") && (
                <FormHelperText error>Category is required.</FormHelperText>
              )}
            </Grid>
            {/* Photo upload */}
            <Grid item xs={12}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => onFiles(e.target.files)}
                disabled={photos.length >= 3}
              />
              <Paper
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                elevation={0}
                sx={{
                  border: "2px dashed",
                  borderColor: "divider",
                  p: 2,
                  textAlign: "center",
                  cursor: photos.length < 3 ? "pointer" : "not-allowed",
                  opacity: photos.length < 3 ? 1 : 0.6,
                }}
                onClick={photos.length < 3 ? handlePickFiles : undefined}
              >
                <Typography variant="body1" sx={{ mb: 1, color: 'secondary.main' }}>
                  Drag & drop photos here, or click to select (min 1, max 3)
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, overflowX: "auto", py: 1, justifyContent: 'center' }}>
                  {previews.length === 0 && (
                    <Typography variant="body2" color="text.secondary">No photos selected</Typography>
                  )}
                  {previews.map((src, i) => (
                    <Box key={src} sx={{ position: "relative", width: 120, height: 80 }}>
                      <img src={src} alt={`preview-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} />
                      <IconButton
                        size="small"
                        sx={{ position: "absolute", top: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.7)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' } }}
                        onClick={(ev) => { ev.stopPropagation(); handleRemovePhoto(i); }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Paper>
              {error === "At least one photo is required." && (
                <FormHelperText error sx={{ textAlign: 'center' }}>
                  {error}
                </FormHelperText>
              )}
            </Grid>
            {error && error !== "At least one photo is required." && error !== "Category is required." && (
              <Grid item xs={12}>
                <Typography color="error">{error}</Typography>
              </Grid>
            )}
            {(addReportMutation.isError || uploadImagesMutation.isError || isErrorCategories) && (
              <Grid item xs={12}>
                <Typography color="error">
                  Error: {addReportMutation.error?.message || uploadImagesMutation.error?.message || categoriesError?.message || "Unknown error"}
                </Typography>
              </Grid>
            )}
            <Grid item xs={12} sx={{ display: "flex", gap: 2, justifyContent: "flex-start" }}>
              <Button
                type="submit"
                variant="contained"
                className="partecipation-button"
                disabled={isSubmitting || isLoadingCategories}
              >
                {isSubmitting ? "Creating..." : "Create Report"}
              </Button>
              <Button
                variant="outlined"
                className="partecipation-button"
                onClick={() => navigate(-1)}
                disabled={isSubmitting || isLoadingCategories}
              >
                Cancel
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Dialog
        open={successDialogOpen}
        disableEscapeKeyDown
        PaperProps={{ sx: { borderRadius: 3, p: 2, minWidth: 360, boxShadow: 6, padding: 4 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, pt: 1 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 3 }}>
            <CheckCircleIcon sx={{ color: 'white', fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Report created</Typography>
            <Typography variant="body2" color="text.secondary">Your report was uploaded successfully. Redirecting to the map...</Typography>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}