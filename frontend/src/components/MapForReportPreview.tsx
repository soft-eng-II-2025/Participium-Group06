import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import { LatLngExpression } from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type Props = {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  zoom?: number;
  height?: string | number;
  interactive?: boolean;
};

const MapForReportPreview: React.FC<Props> = ({ latitude, longitude, zoom = 13, height = 300, interactive = false }) => {
  const markerRef = useRef<L.Marker | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (latitude == null || longitude == null) return;
    const id = window.setTimeout(() => {
      try {
        // center map on marker
        mapRef.current?.setView([latitude, longitude], mapRef.current?.getZoom() ?? zoom);
      } catch (e) {
        // ignore
      }
    }, 100);
    return () => clearTimeout(id);
  }, [latitude, longitude, zoom]);

  if (latitude == null || longitude == null) return null;

  const center: LatLngExpression = [latitude, longitude];

  return (
    <div style={{ height, width: "100%" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        ref={(m) => { (mapRef as any).current = m as any; }}
        style={{ height: "100%", width: "100%" }}
        dragging={interactive}
        doubleClickZoom={interactive}
        scrollWheelZoom={interactive}
        touchZoom={interactive}
        zoomControl={interactive}
        keyboard={interactive}
        boxZoom={interactive}
        attributionControl={interactive}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        <Marker position={center} ref={markerRef} />
      </MapContainer>
    </div>
  );
};

export default MapForReportPreview;
