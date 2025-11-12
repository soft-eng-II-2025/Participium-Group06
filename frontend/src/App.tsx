// import "./App.css";
import 'leaflet/dist/leaflet.css';
import { GlobalStyles, ThemeProvider, Box, CircularProgress} from "@mui/material";
import Map from "../src/pages/Map";
import Layout from './layout/Layout';
import theme from "./theme/index";
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import AdminHomePage from "./pages/AdminHomePage";
import AdminRegisterPage from "./pages/AdminRegisterPage";
import RequireRole from './routes/RequireRole';
import ProtectedRoute from './routes/ProtectedRoute';
import GuestRoute from './routes/GuestRoute';
import NewReportPage from './pages/NewReportPage';
import { useAuth } from './contexts/AuthContext';


const queryClient = new QueryClient();

function App() {
    const HomeSelector: React.FC = () => {
        const { isAuthenticated, role, loading } = useAuth();
        if (loading) return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <CircularProgress />
            </Box>
        );
        if (!isAuthenticated) return <HomePage />;
        if (role === 'ADMIN') return <AdminHomePage />;
        if (role === 'USER') return <Map />;
    };
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <AuthProvider>
                    <GlobalStyles
                        styles={{ body: { backgroundColor: theme.palette.background.default, margin: 0, padding: 0 } }} />
                    <BrowserRouter>
                        <Layout>
                            <Routes>
                                <Route path="/" element={<HomeSelector />} />
                                <Route path="/login" element={
                                    <GuestRoute>
                                        <LoginPage />
                                    </GuestRoute>} />
                                <Route path="/register" element={<RegisterPage />} />
                                {/* <Route path="/map" element={
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
                                } /> */}
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
