import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  GeoJSON,
  useMapEvents,
  Circle,
  Popup,
} from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Typography,
  Box,
  TextField,
  IconButton,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { ReportsApi } from "../api/reportsApi";
import ReportDrawer from "./ReportDrawer";
import { ReportResponseDTO } from "../DTOs/ReportResponseDTO";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

export const TURIN_BBOX = "7.550,45.000,7.800,45.150";

/* ----------------------------- ICON FIX ---------------------------- */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/* -------------------------- HELPER FUNCTIONS ---------------------- */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371e3;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ---------------------------- ICONS -------------------------------- */
const newReportIcon = L.divIcon({
  className: "new-report-pin",
  html: `<div style="
    width: 28px;
    height: 28px;
    background:#d33;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    border:2px solid white;"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

/* ---------------------------- CLICK HANDLER ------------------------ */
const ClickHandler: React.FC<{
  geoData: any;
  onSelect: (lat: number, lng: number) => void;
}> = ({ geoData, onSelect }) => {
  const navigate = useNavigate();
  const [position, setPosition] = useState<LatLngExpression | null>(null);

  useMapEvents({
    click(e) {
      const polygon = geoData?.features?.[0]?.geometry;
      if (!polygon) return;

      const { lat, lng } = e.latlng;
      const inside = booleanPointInPolygon(point([lng, lat]), polygon);
      if (!inside) return;

      setPosition([lat, lng]);
      onSelect(lat, lng);
    },
  });

  return position ? (
    <Marker position={position} icon={newReportIcon}>
      <Popup>
        <Button
          fullWidth
          variant="contained"
          onClick={() => {
            const [lat, lng] = position as [number, number];
            navigate("/new-report", {
              state: { latitude: lat, longitude: lng },
            });
          }}
        >
          Add report
        </Button>
      </Popup>
    </Marker>
  ) : null;
};

/* ---------------------------- MAIN COMPONENT ----------------------- */
const MapSelector: React.FC<{ onSelect: (lat: number, lng: number) => void }> = ({
  onSelect,
}) => {
  const searchRef = useRef<HTMLDivElement | null>(null);

  const [geoData, setGeoData] = useState<any>(null);
  const [reports, setReports] = useState<ReportResponseDTO[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportResponseDTO | null>(null);
  const [openDrawer, setOpenDrawer] = useState(false);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [previewCenter, setPreviewCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any | null>(null);
  const [radius, setRadius] = useState(500);
  const [searchOpen, setSearchOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

  const [mapCenter, setMapCenter] = useState<LatLngExpression>([45.0703, 7.6869]);
  const [mapZoom, setMapZoom] = useState(12.5);

  /* ------------------------ WINDOW RESIZE -------------------------- */
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ------------------------ DISABLE MAP EVENTS --------------------- */
  useEffect(() => {
    if (!searchRef.current) return;
    L.DomEvent.disableClickPropagation(searchRef.current);
    L.DomEvent.disableScrollPropagation(searchRef.current);
  }, [searchOpen]);

  /* ------------------------ LOAD DATA ------------------------------ */
  useEffect(() => {
    (async () => {
      const boundary = await fetch("/turin-boundary.geojson").then((r) => r.json());
      setGeoData(boundary);

      const api = new ReportsApi();
      setReports(await api.getApprovedReports());
    })();
  }, []);

  /* ------------------------ AUTOCOMPLETE --------------------------- */
  useEffect(() => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setPreviewCenter(null);
      return;
    }

    const id = setTimeout(async () => {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `format=json&limit=5&countrycodes=it&bounded=1` +
          `&viewbox=${TURIN_BBOX}&addressdetails=1` +
          `&q=${encodeURIComponent(query + ", Torino")}`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "Participium/1.0",
          },
        }
      );

      if (!res.ok) return;
      setSuggestions(await res.json());
    }, 400);

    return () => clearTimeout(id);
  }, [query]);

  /* ------------------------ HANDLE SELECT -------------------------- */
  const selectSuggestion = (s: any) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setSearchCenter({ lat, lng });
    setMapCenter([lat, lng]);
    setMapZoom(15);
    setSuggestions([]);
    setSelectedSuggestion(s);
    setSearchOpen(false);
  };

  /* ------------------------ HANDLE REPORT OPEN -------------------- */
  const handleReportOpen = (r: ReportResponseDTO) => {
    setSelectedReport(r);
    setOpenDrawer(true);
    setSearchOpen(false);
  };

  /* ------------------------ CLEAR SELECTION ON EMPTY QUERY -------- */
  useEffect(() => {
    if (query.trim() === "") {
      setSearchCenter(null);
      setSuggestions([]);
      setSelectedSuggestion(null);
      setPreviewCenter(null);
    }
  }, [query]);

  return (
    <>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap & CartoDB"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* SEARCH BUTTON */}
        <IconButton
        sx={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 1000,
            backgroundColor: "#003366",
            color: "white",
            "&:hover": {
            backgroundColor: "#002244", // slightly darker for hover effect
            },
        }}
        onClick={() => setSearchOpen((v) => !v)}
        >
        <SearchIcon />
        </IconButton>

        {/* SEARCH PANEL */}
        {searchOpen && (
          <Box
            ref={searchRef}
            sx={{
              position: "absolute",
              top: 56,
              right: 16,
              zIndex: 2000,
              background: "white",
              p: 2,
              width: 320,
              borderRadius: 2,
              boxShadow: 4,
              pointerEvents: "auto",
            }}
          >
            <TextField
              size="small"
              fullWidth
              label="Search address"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {suggestions.map((s) => (
              <Box
                key={s.place_id}
                sx={{ p: 1, cursor: "pointer", color: "black" }}
                onMouseEnter={() =>
                  setPreviewCenter({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) })
                }
                onMouseLeave={() => setPreviewCenter(null)}
                onClick={() => selectSuggestion(s)}
              >
                {s.display_name}
              </Box>
            ))}
            <TextField
              type="number"
              size="small"
              fullWidth
              label="Radius (meters)"
              value={radius}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) setRadius(val);
              }}
              inputProps={{
                min: 100,
                max: 3000,
                step: 100,
              }}
              sx={{ mt: 1 }}
            />
          </Box>
        )}

        {/* PREVIEW CIRCLE */}
        {previewCenter && (
          <Circle
            center={[previewCenter.lat, previewCenter.lng]}
            radius={radius}
            pathOptions={{ color: "blue", fillOpacity: 0.05 }}
          />
        )}

        {/* SELECTED SEARCH CIRCLE */}
        {searchCenter && (
          <Circle
            center={[searchCenter.lat, searchCenter.lng]}
            radius={radius}
            pathOptions={{ color: "black", fillOpacity: 0.1 }}
          />
        )}

        {/* REPORTS */}
        <MarkerClusterGroup>
          {reports
            .filter((r) => {
              if (!searchCenter) return true;
              return (
                haversineDistance(
                  searchCenter.lat,
                  searchCenter.lng,
                  r.latitude,
                  r.longitude
                ) <= radius
              );
            })
            .map((r) => (
              <Marker key={r.id} position={[r.latitude, r.longitude]}>
                <Popup>
                          <Stack spacing={0.5}>
                              <Typography variant="subtitle1" sx={{fontWeight:'bold'}}>{r.title}</Typography>
                              <Typography variant="body2">{new Date(r.createdAt).toLocaleDateString()} - {r.category}</Typography>                            
                              <Typography variant="body2">Reporter: {r.anonymous ? "Anonymous" : `${r.user?.first_name} ${r.user?.last_name}`}</Typography>                            
                          </Stack>
                          <Button
                              color="primary"
                              variant="contained"
                              className="partecipation-button"
                              size="small"
                              sx={{ marginTop: "8px", width: '100%' }}
                              onClick={() => {
                                  setOpenDrawer(true);
                                  setSelectedReport(r);
                              }}
                          >
                              View Details
                          </Button>
                      </Popup>
              </Marker>
            ))}
        </MarkerClusterGroup>

        {geoData && <GeoJSON data={geoData} />}
        <ClickHandler geoData={geoData} onSelect={onSelect} />

        <ReportDrawer
          open={openDrawer}
          onClose={() => setOpenDrawer(false)}
          report={selectedReport}
        />
      </MapContainer>

      {/* FIXED BOTTOM-LEFT POPUP */}
      {selectedSuggestion && windowWidth > 600 && (
        <Box
          sx={{
            position: "fixed",
            bottom: 16,
            left: 16,
            backgroundColor: "white",
            padding: 2,
            color: "black",
            borderRadius: 2,
            boxShadow: 4,
            zIndex: 3000,
            maxWidth: 320,
          }}
        >
          <Typography variant="body2">{selectedSuggestion.display_name}</Typography>
        </Box>
      )}
    </>
  );
};

export default MapSelector;
