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
      <div style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100vh"
      }}>
          {/* Wrapper div per gestire lo stile responsive */}
          <div style={{ flex: 1, minHeight: 300 }}>
              <MapSelector onSelect={handleSelect} />
          </div>
      </div>
  );
};


export default Map;
