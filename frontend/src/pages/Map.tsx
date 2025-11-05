import React, { useState } from "react";
import MapSelector from "../components/MapSelector";

const Map: React.FC = () => {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);


  const handleSelect = (lat: number, lng: number) => {
    setLat(lat);
    setLng(lng);
    // Qui in futuro potrai passare le coordinate a un form o a uno store globale
  };

  return (
    <div style={{ height: "100vh", width: "100vw", border: "3px solid red" }}>
  <MapSelector onSelect={handleSelect} />
  </div>
  );
};


export default Map;
