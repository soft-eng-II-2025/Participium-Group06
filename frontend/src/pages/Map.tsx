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
    <div style={{ height: "100vw", width: "100vw", paddingTop: "64px" }}>
  <MapSelector onSelect={handleSelect} />
  </div>
  );
};


export default Map;
