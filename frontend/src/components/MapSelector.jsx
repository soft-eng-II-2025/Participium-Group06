import React from "react";
import { MapContainer, TileLayer, useMapEvents, Marker, Popup } from "react-leaflet";

const ClickHandler = ({ onSelect }) => {
  const [position, setPosition] = React.useState(null);
    React.useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      setPosition([latitude, longitude]);
      onSelect(latitude, longitude);
    });
  }, []);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onSelect(lat, lng);
    },
  });

  return position ? (
    <Marker position={position}>
      <Popup>
        Latitude: {position[0].toFixed(5)}, Longitude: {position[1].toFixed(5)}
      </Popup>
    </Marker>
  ) : null;
};

const MapSelector = ({ onSelect }) => {
  return (
    <MapContainer
      center={[45.071, 7.67]} // Initial center (Turin)
      zoom={13}
      style={{ height: "400px", width: "100%" }}
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
