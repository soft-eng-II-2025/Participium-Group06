//import "./App.css";
import 'leaflet/dist/leaflet.css';
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import Map from "../src/pages/Map";


function App() {
    return (

            <BrowserRouter>
                <Routes>
                    {/* Always start from the map page to try this one out*/}
                    <Route path="/" element={<Navigate to="/map" replace/>}/>

                    {/* 1) Map */}
                    <Route path="/map" element={<Map/>}/>
        
                    <Route path="*" element={<Navigate to="/map" replace/>}/>
                </Routes>
            </BrowserRouter>
    );
}

export default App