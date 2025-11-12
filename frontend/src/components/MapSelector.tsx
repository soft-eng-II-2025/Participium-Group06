import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  useMapEvents,
} from "react-leaflet";
import { LatLngExpression } from "leaflet";
import L from "leaflet";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import { Feature, Polygon as GeoJSONPolygon } from "geojson";
import { useNavigate } from "react-router-dom";

// @ts-ignore
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
// @ts-ignore
import markerIcon from "leaflet/dist/images/marker-icon.png";
// @ts-ignore
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix default Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapSelectorProps {
  onSelect: (lat: number, lng: number) => void;
}

// Handles marker placement inside polygon
const ClickHandler: React.FC<{
  onSelect: (lat: number, lng: number) => void;
  geoData: any | null;
}> = ({ onSelect, geoData }) => {
  const [position, setPosition] = useState<LatLngExpression | null>(null);
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
      onSelect(lat, lng); // navigation will happen here
    } else {
      alert("❌ You must select a point inside the boundary of Turin.");
    }
  },
});


  React.useEffect(() => {
    if (position && markerRef.current) markerRef.current.openPopup();
  }, [position]);

  const handleCreateReport = () => {
    if (position && Array.isArray(position)) {
      const [lat, lng] = position;
      navigate("/new-report", { state: { latitude: lat, longitude: lng } });
    }
  };

  if (!position) return null;

  return (
    <Marker position={position} ref={markerRef}>
      <Popup>
        <div style={{ textAlign: "center" }}>
          <p>Hai selezionato le coordinate:</p>
          <p>
            Lat: {Array.isArray(position) ? position[0].toFixed(4) : ""}, Lng:{" "}
            {Array.isArray(position) ? position[1].toFixed(4) : ""}
          </p>
          <button
            onClick={handleCreateReport}
            style={{
              padding: "8px 16px",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Crea Report
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

const MapSelector: React.FC<MapSelectorProps> = ({ onSelect }) => {
  const [geoData, setGeoData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/turin-boundary.geojson")
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Error loading GeoJSON:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading map...</p>;

  return (
    <MapContainer
      center={[45.00, 7.7]}
      zoom={12.5}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {geoData?.features && geoData.features.length > 0 && (
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

      <ClickHandler onSelect={onSelect} geoData={geoData} />
    </MapContainer>
  );
};

export default MapSelector;
