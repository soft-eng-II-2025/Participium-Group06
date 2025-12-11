// import "./App.css";
import 'leaflet/dist/leaflet.css';
import { GlobalStyles, ThemeProvider, Box, CircularProgress} from "@mui/material";
import StreetMap from "../src/pages/Map";
import Layout from './layout/Layout';
import theme from "./theme/index";
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import AdminHomePage from "./pages/AdminHomePage";
import AdminRegisterPage from "./pages/AdminRegisterPage";
import TechAgentHomePage from './pages/TechAgentHomePage';
import OrganizationOfficerHomePage from './pages/OrganizationOfficerHomePage';
import RequireRole from './routes/RequireRole';
import GuestRoute from './routes/GuestRoute';
import NewReportPage from './pages/NewReportPage';
import { useAuth } from './contexts/AuthContext';
import TechLeadHomePage from './pages/TechLeadHomePage';
import {UserAccountPage} from "./pages/UserAccountPage";
import UserReportsPage from './pages/UserReportsPage';
import EmailConfirmationPage from './pages/EmailConfirmationPage';
import { UserResponseDTO } from './DTOs/UserResponseDTO';
import ProtectedRoute, { RequireUnverifiedUser } from './routes/ProtectedRoute';


const queryClient = new QueryClient();

function App() {
    const HomeSelector: React.FC = () => {
        const { isAuthenticated, role, loading, user } = useAuth();
        if (loading) return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <CircularProgress />
            </Box>
        );
        // if the user is authenticated but hasn't confirmed their email, send them to confirmation
        if (isAuthenticated && (user as UserResponseDTO).verified === false) {
            return <Navigate to="/confirm-email" replace />;
        }


        if (!isAuthenticated) return <HomePage />;
        if (role === 'ADMIN') return <ProtectedRoute><AdminHomePage /></ProtectedRoute>;
        if (role === 'USER') return <ProtectedRoute><Map /></ProtectedRoute>;
        if (role === 'ORGANIZATION_OFFICER') return <ProtectedRoute><OrganizationOfficerHomePage /></ProtectedRoute>;
        if (role?.startsWith('TECH_LEAD')) return <ProtectedRoute><TechLeadHomePage /></ProtectedRoute>;
        if (role?.startsWith('TECH_AGENT')) return <ProtectedRoute><TechAgentHomePage /></ProtectedRoute>;
        else return <HomePage />;
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

                                
                                <Route path="/my-reports" element={
                                    <ProtectedRoute>
                                        <RequireRole role="USER">
                                            <UserReportsPage />
                                        </RequireRole>
                                    </ProtectedRoute>
                                }
                            />

                                <Route path="/new-report" element={
                                    <ProtectedRoute>
                                        <RequireRole role="USER">
                                            <NewReportPage />
                                        </RequireRole>
                                    </ProtectedRoute>
                                } />
                                <Route path="/account" element={
                                    <ProtectedRoute>
                                        <RequireRole role="USER">
                                            <UserAccountPage />
                                        </RequireRole>
                                    </ProtectedRoute>
                                } />
                                <Route path="/admin/register" element={
                                    <ProtectedRoute>
                                        <RequireRole role="ADMIN">
                                            <AdminRegisterPage />
                                        </RequireRole>
                                    </ProtectedRoute>
                                } />
                                <Route path="/confirm-email" element={
                                    <RequireUnverifiedUser>
                                        <EmailConfirmationPage />
                                    </RequireUnverifiedUser>} />
                            </Routes>
                        </Layout>
                    </BrowserRouter>
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default App;
