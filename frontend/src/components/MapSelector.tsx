import React, { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    GeoJSON,
    useMapEvents,
} from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import { ReportsApi } from "../api/reportsApi";
import MarkerClusterGroup from "react-leaflet-markercluster";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { ReportResponseDTO } from "../DTOs/ReportResponseDTO";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";


// Fix default Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Custom marker for new report
const myCustomColour = "#d33";
const markerHtmlStyles = `
  background-color: ${myCustomColour};
  width: 2rem;
  height: 2rem;
  display: block;
  left: -1rem;
  top: -1rem;
  position: relative;
  border-radius: 2rem 2rem 0;
  transform: rotate(45deg);
  border: 1px solid #FFFFFF;
`;
export const newReportIcon = L.divIcon({
  className: "my-custom-pin",
  iconAnchor: [0, 24],
  popupAnchor: [0, -36],
  html: `<span style="${markerHtmlStyles}" />`,
});

// Default icon for existing reports
const existingReportIcon = new L.Icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

interface MapSelectorProps {
    onSelect: (lat: number, lng: number) => void;
}

/* ------------------------- CLICK HANDLER ------------------------- */
const ClickHandler: React.FC<{
    onSelect: (lat: number, lng: number) => void;
    geoData: any | null;
}> = ({ onSelect, geoData }) => {
    const [position, setPosition] = useState<LatLngExpression | null>(null);
    const [tempInvalid, setTempInvalid] = useState<LatLngExpression | null>(null);
    const markerRef = React.useRef<L.Marker>(null);
    const navigate = useNavigate();

    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            if (!geoData) return;

            const polygonGeometry =
                geoData.type === "FeatureCollection"
                    ? geoData.features[0]?.geometry
                    : geoData.type === "Feature"
                    ? geoData.geometry
                    : null;

            if (!polygonGeometry) return;

            const pt = point([lng, lat]);
            const inside = booleanPointInPolygon(pt, polygonGeometry);

            if (inside) {
                setPosition([lat, lng]);
                onSelect(lat, lng);
            } else {
                setTempInvalid([lat, lng]);
                setTimeout(() => setTempInvalid(null), 2000);
            }
        },
    });

    useEffect(() => {
        if (!position) return;
        const tryOpen = () => {
            try {
                markerRef.current?.openPopup?.();
            } catch {}
        };
        tryOpen();
        const id = window.setTimeout(tryOpen, 0);
        return () => clearTimeout(id);
    }, [position]);

    const handleCreateReport = () => {
        if (position && Array.isArray(position)) {
            const [lat, lng] = position;
            navigate("/new-report", { state: { latitude: lat, longitude: lng } });
        }
    };

    return (
        <>
            {position && (
                <Marker position={position} ref={markerRef} icon={newReportIcon}>
                    <Popup>
                        <div style={{ textAlign: "center" }}>
                            <p><strong>Do you want to report an issue here?</strong></p>
                            <p>Latitude: {Array.isArray(position) ? position[0].toFixed(4) : ""}</p>
                            <p>Longitude: {Array.isArray(position) ? position[1].toFixed(4) : ""}</p>

                            <Button
                                color="primary"
                                variant="contained"
                                size="small"
                                onClick={handleCreateReport}
                                sx={{ marginTop: "8px", mr: "8px", px: 2 }}
                            >
                                Add Report
                            </Button>
                        </div>
                    </Popup>
                </Marker>
            )}
            {tempInvalid && (
                <Marker position={tempInvalid}>
                    <Popup>❌ Point outside the boundary!</Popup>
                </Marker>
            )}
        </>
    );
};

/* ------------------------- MAIN MAP SELECTOR ------------------------- */
const MapSelector: React.FC<MapSelectorProps> = ({ onSelect }) => {
    const [geoData, setGeoData] = useState<any | null>(null);
    const [reports, setReports] = useState<ReportResponseDTO[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const boundaryRes = await fetch("/turin-boundary.geojson");
                const boundaryJson = await boundaryRes.json();
                setGeoData(boundaryJson);

                const reportsApi = new ReportsApi();
                const approved = await reportsApi.getApprovedReports();
                setReports(approved);

            } catch (err) {
                console.error("Error loading map data:", err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    if (loading) return <p>Loading map...</p>;

    return (
        <MapContainer
            center={[45.0703, 7.6869]}
            zoom={12.5}
            style={{ height: "100%", width: "100%" }}
        >
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {geoData?.features && (
                <GeoJSON
                    data={geoData}
                    style={{
                        color: "blue",
                        weight: 2,
                        fillColor: "lightblue",
                        fillOpacity: 0.2,
                    }}
                />
            )}

            {/* MARKER CLUSTER GROUP FOR EXISTING REPORTS */}
            <MarkerClusterGroup
              showCoverageOnHover={false}
              spiderfyOnMaxZoom={true}
              maxClusterRadius={50}
              iconCreateFunction={(cluster: any) => {
                const count = cluster.getChildCount();
                return L.divIcon({
                    html: `<div style="
                    background-color: #2C84CB;
                    color: white;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 3px solid #fff;
                    box-shadow: 0 0 10px rgba(0,0,0,0.6);
                    font-weight: bold;
                    font-size: 16px;
                    ">${count}</div>`,
                    className: "custom-cluster-icon",
                    iconSize: L.point(50, 50, true),
                });
                }}

            >
              {reports.map((r) => (
                  <Marker
                      key={`${r.latitude}-${r.longitude}-${r.title}`}
                      position={[r.latitude, r.longitude]}
                      icon={existingReportIcon}
                  >
                      <Popup>
                          <div>
                              <strong>{r.title}</strong>
                              <br />
                              <em>{r.description}</em>
                              <br />
                              Reporter: {r.user?.first_name} {r.user?.last_name}
                              <br />
                              Status: {r.status}
                              <br />
                              Assigned Officer: {r.officer?.first_name} {r.officer?.last_name}
                          </div>
                      </Popup>
                  </Marker>
              ))}
            </MarkerClusterGroup>

            {/* Click-to-add-report logic */}
            <ClickHandler onSelect={onSelect} geoData={geoData} />
        </MapContainer>
    );
};

export default MapSelector;
