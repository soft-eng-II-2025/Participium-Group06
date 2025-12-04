import React, {useState} from "react";
import MapSelector from "../components/MapSelector";

const StreetMap: React.FC = () => {
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);


    const handleSelect = (lat: number, lng: number) => {
        setLat(lat);
        setLng(lng);
        // Qui in futuro potrai passare le coordinate a un form o a uno store globale
    };

    return (
        <div
            style={{
                width: "100%",
                height: `calc(100vh - ${64}px)`,
                //marginTop: 64
            }}
        >
            {/* Wrapper div per gestire lo stile responsive */}
            <MapSelector onSelect={handleSelect}/>

        </div>
    );
};


export default StreetMap;
