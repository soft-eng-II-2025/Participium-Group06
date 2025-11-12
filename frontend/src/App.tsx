// import "./App.css";
import 'leaflet/dist/leaflet.css';
import { GlobalStyles } from "@mui/material";
import { ThemeProvider } from '@mui/material';
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NewReportPage from './pages/NewReportPage';


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
                                        <RequireRole role="USER">
                                            <Map />
                                        </RequireRole>
                                    </ProtectedRoute>
                                } />
                                <Route path="/admin/home" element={
                                    <RequireRole role="ADMIN">
                                        <AdminHomePage />
                                    </RequireRole>
                                } />
                                <Route path="/new-report" element={
                                    <ProtectedRoute>
                                    <RequireRole role="USER">
                                        <NewReportPage />
                                    </RequireRole>
                                    </ProtectedRoute>
                                } />
                                <Route path="/admin/register" element={
                                    <RequireRole role="ADMIN">
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
