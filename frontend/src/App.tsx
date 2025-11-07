// import "./App.css";
import 'leaflet/dist/leaflet.css';
import { GlobalStyles } from "@mui/material";
import { ThemeProvider } from '@mui/material';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Map from "../src/pages/Map";
import Layout from './layout/Layout';
import theme from "./theme/index";
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';



function App() {
    return (
        <ThemeProvider theme={theme}>
            <GlobalStyles styles={{ body: { backgroundColor: theme.palette.background.default, margin: 0, padding: 0 } }} />
            <BrowserRouter>
                <Layout>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/map" element={<Map />} />
                    </Routes>
                </Layout>
            </BrowserRouter>
        </ThemeProvider >

    );
}

export default App;
