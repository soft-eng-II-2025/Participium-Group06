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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from './contexts/AuthContext';
import AdminHomePage from "./pages/AdminHomePage";
import AdminRegisterPage from "./pages/AdminRegisterPage";
import RequireRole from './routes/RequireRole';
import ProtectedRoute from './routes/ProtectedRoute';
import GuestRoute from './routes/GuestRoute';


const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <AuthProvider>
                    <GlobalStyles
                        styles={{ body: { backgroundColor: theme.palette.background.default, margin: 0, padding: 0 } }} />
                    <BrowserRouter>
                        <Layout>
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/login" element={
                                    <GuestRoute>
                                        <LoginPage />
                                    </GuestRoute>} />
                                <Route path="/register" element={<RegisterPage />} />
                                <Route path="/map" element={
                                    <ProtectedRoute>
                                        <Map />
                                    </ProtectedRoute>
                                } />
                                <Route path="/admin/home" element={
                                    <RequireRole role="admin">
                                        <AdminHomePage />
                                    </RequireRole>
                                } />
                                <Route path="/admin/register" element={
                                    <RequireRole role="admin">
                                        <AdminRegisterPage />
                                    </RequireRole>
                                } />
                            </Routes>
                        </Layout>
                    </BrowserRouter>
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default App;
