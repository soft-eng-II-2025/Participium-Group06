import React from "react";
import { MapContainer, TileLayer, useMapEvents, Marker, Popup } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom"; // Importa useNavigate

// @ts-ignore
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
// @ts-ignore
import markerIcon from "leaflet/dist/images/marker-icon.png";
// @ts-ignore
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
  const navigate = useNavigate(); // Inizializza useNavigate

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onSelect(lat, lng);
    },
  });

  const markerRef = React.useRef<L.Marker>(null);
  React.useEffect(() => {
    if (position && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [position]);

  const handleCreateReport = () => {
    if (position && Array.isArray(position)) {
      const [lat, lng] = position;
      navigate("/new-report", { state: { latitude: lat, longitude: lng } });
    }
  };

  return position ? (
    <Marker position={position} ref={markerRef}>
      <Popup>
        <div style={{ textAlign: "center" }}>
          <p>Hai selezionato le coordinate:</p>
          <p>Lat: {Array.isArray(position) ? position[0].toFixed(4) : ''}, Lng: {Array.isArray(position) ? position[1].toFixed(4) : ''}</p>
          <button
            onClick={handleCreateReport}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Crea Report
          </button>
        </div>
      </Popup>
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