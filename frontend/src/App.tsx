// import "./App.css";
import 'leaflet/dist/leaflet.css';
import {GlobalStyles} from "@mui/material";
import {ThemeProvider} from '@mui/material';
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import Map from "../src/pages/Map";
import Layout from './layout/Layout';
import theme from "./theme/index";
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import AdminHomePage from "./pages/AdminHomePage";


const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <GlobalStyles
                    styles={{body: {backgroundColor: theme.palette.background.default, margin: 0, padding: 0}}}/>
                <BrowserRouter>
                    <Layout>
                        <Routes>
                            <Route path="/" element={<HomePage/>}/>
                            <Route path="/login" element={<LoginPage/>}/>
                            <Route path="/register" element={<RegisterPage/>}/>
                            <Route path="/map" element={<Map/>}/>
                            <Route path="/admin/home" element={<AdminHomePage/>} />
                        </Routes>
                    </Layout>
                </BrowserRouter>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default App;
