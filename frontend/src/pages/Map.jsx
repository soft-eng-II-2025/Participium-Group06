import React, { useState } from "react";
import MapSelector from "../components/MapSelector";

const Map = () => {
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  const handleSelect = (lat, lng) => {
    setLat(lat);
    setLng(lng);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Select a Point on the Map</h1>
      <MapSelector onSelect={handleSelect} />
      <form className="space-y-2">
        <label className="block">
          Latitude:
          <input type="text" value={lat ?? ""} readOnly className="border p-2 w-full" />
        </label>
        <label className="block">
          Longitude:
          <input type="text" value={lng ?? ""} readOnly className="border p-2 w-full" />
        </label>
      </form>
    </div>
  );
};

export default Map;
