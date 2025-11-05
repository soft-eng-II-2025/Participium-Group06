import React from "react";
import { MapContainer, TileLayer, useMapEvents, Marker, Popup } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import L from "leaflet";
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

const ClickHandler: React.FC<{ onSelect: (lat: number, lng: number) => void }> = ({ onSelect }) => {
  const [position, setPosition] = React.useState<LatLngExpression | null>(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onSelect(lat, lng);
    },
  });

  return position ? (
    <Marker position={position}>
      <Popup>Hai selezionato un punto</Popup>
    </Marker>
  ) : null;
};

const MapSelector: React.FC<MapSelectorProps> = ({ onSelect }) => {
  return (
    <MapContainer
      center={[45.095, 7.70]} // Torino, come esempio di posizione iniziale
      zoom={13}
      style={{ height: "100%", width: "100%" }} // La mappa riempie tutto
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onSelect={onSelect} />
    </MapContainer>
  );
};

export default MapSelector;
