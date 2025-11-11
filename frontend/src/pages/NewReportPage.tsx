// ...existing code...
import React, { useState, useRef, useCallback, useEffect } from "react";
import { Box, Button, TextField, Grid, Typography, Paper, Select, MenuItem } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

type FormState = {
  id: number | "";
  longitude: number | "";
  latitude: number | "";
  title: string;
  description: string;
  userId: number | "";
  categoryId: number | "";
};

type Props = {
  latitude: number;
  longitude: number;
};

export default function NewReportPage(props: Props) {
const location = useLocation();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [form, setForm] = useState<FormState>({
    id: "",
    longitude: location.state?.longitude,
    latitude: location.state?.latitude,
    title: "",
    description: "",
    userId: "",
    categoryId: "",
    photo: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // generate previews when photos change
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
    // append
    setPhotos((p) => [...p, ...arr].slice(0, 10)); // limit to 10
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
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.value;
      if (key === "id" || key === "userId" || key === "categoryId") {
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
   
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setSubmitting(true);

    const payload = {
      id: form.id === "" ? undefined : form.id,
      longitude: Number(form.longitude),
      latitude: Number(form.latitude),
      title: form.title,
      description: form.description,
      categoryId: form.categoryId === "" ? undefined : form.categoryId,
      photo: form.photo === "" ? undefined : form.photo,
    };

    try {
      // todo add API call to create report

      // success — navigate or clear form
      navigate("/map");
    } catch (err: any) {
      setError(err.message ?? "Failed to create report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // center the form horizontally and vertically and constrain width
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100vw" }}>
          <Paper elevation={3} sx={{ width: "100%", maxWidth: 520, borderRadius: "12px", textAlign: "center", p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, color: 'secondary.main', pb: 4 }}>
          Create a New Report
        </Typography>

        <form onSubmit={handleSubmit}>
          {/* increase spacing between fields */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Longitude"
                type="number"
                value={form.longitude}
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
                value={form.latitude}
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

            <Grid item xs={12} sm={12}>
              <Select
                displayEmpty
                value={form.categoryId}
                fullWidth
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    categoryId: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                <MenuItem value={1}>Pothole</MenuItem>
                <MenuItem value={2}>Street Light</MenuItem>
                <MenuItem value={3}>Graffiti</MenuItem>
                <MenuItem value={4}>Trash</MenuItem>
              </Select>
            </Grid>

            {/* Photo upload: drag-and-drop or click to pick */}
            <Grid item xs={12}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => onFiles(e.target.files)}
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
                  cursor: "pointer",
                }}
                onClick={handlePickFiles}
              >
                <Typography variant="body1" sx={{ mb: 1, color: 'secondary.main' }}>
                  Drag & drop photos here, or click to select (max 3)
                </Typography>
                <Box sx={{ display: "flex", gap: 1, overflowX: "auto", py: 1 }}>
                  {previews.length === 0 && (
                    <Typography variant="body2" color="text.secondary">No photos selected</Typography>
                  )}
                  {previews.map((src, i) => (
                    <Box key={src} sx={{ position: "relative" }}>
                      <img src={src} alt={`preview-${i}`} style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 6 }} />
                      <Button
                        size="small"
                        color="inherit"
                        onClick={(ev) => { ev.stopPropagation(); handleRemovePhoto(i); }}
                        sx={{ position: "absolute", top: 4, right: 4, minWidth: 0, p: 0.5 }}
                      >
                        ✕
                      </Button>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>


            {error && (
              <Grid item xs={12}>
                <Typography color="error">{error}</Typography>
              </Grid>
            )}

            <Grid item xs={12} sx={{ display: "flex", gap: 2, justifyContent: "flex-start" }}>
              <Button
                type="submit"
                variant="contained"
                className="partecipation-button"
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create Report"}
              </Button>
              <Button
                variant="outlined"
                className="partecipation-button"
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                Cancel
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}
// ...existing code...