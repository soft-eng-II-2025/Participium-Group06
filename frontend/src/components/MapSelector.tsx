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

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapSelectorProps {
  onSelect: (lat: number, lng: number) => void;
}

const ClickHandler: React.FC<{
  onSelect: (lat: number, lng: number) => void;
  geoData: any | null;
}> = ({ onSelect, geoData }) => {
  const [position, setPosition] = useState<LatLngExpression | null>(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (!geoData) return;

      // 🧩 Safely extract the polygon geometry
      const polygon =
        geoData.type === "FeatureCollection"
          ? geoData.features[0]?.geometry
          : geoData.type === "Feature"
          ? geoData.geometry
          : null;

      if (!polygon) {
        console.error("Invalid GeoJSON format — no geometry found:", geoData);
        alert("Boundary data not valid.");
        return;
      }

      const pt = point([lng, lat]);
      const inside = booleanPointInPolygon(pt, polygon);

      if (inside) {
        setPosition([lat, lng]);
        onSelect(lat, lng);
      } else {
        alert("❌ You must select a point inside the boundary of Turin.");
      }
    },
  });

  return position ? (
    <Marker position={position}>
      <Popup>Hai selezionato un punto</Popup>
    </Marker>
  ) : null;
};

const MapSelector: React.FC<MapSelectorProps> = ({ onSelect }) => {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch("/turin-boundary.geojson")
      .then((res) => res.json())
      .then((data) => {
        // 💡 Normalize structure if it's an Overpass-style JSON
        if (data.elements) {
          console.warn(
            "Overpass format detected — converting manually is required!"
          );
        }
        setGeoData(data);
      })
      .catch((err) => console.error("Error loading GeoJSON:", err));
  }, []);

  return (
    <MapContainer
      center={[45.07, 7.68]}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {geoData && geoData.features && (
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
