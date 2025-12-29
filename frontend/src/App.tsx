// import "./App.css";
import 'leaflet/dist/leaflet.css';
import { GlobalStyles, ThemeProvider} from "@mui/material";
import StreetMap from "../src/pages/Map";
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
import TechAgentHomePage from './pages/TechAgentHomePage';
import OrganizationOfficerHomePage from './pages/OrganizationOfficerHomePage';
import RequireRole from './routes/RequireRole';
import GuestRoute from './routes/GuestRoute';
import NewReportPage from './pages/NewReportPage';
import TechLeadHomePage from './pages/TechLeadHomePage';
import {UserAccountPage} from "./pages/UserAccountPage";
import UserReportsPage from './pages/UserReportsPage';
import EmailConfirmationPage from './pages/EmailConfirmationPage';
import ProtectedRoute, { RequireUnverifiedUser } from './routes/ProtectedRoute';


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
                                <Route path="/reports/map" element={<ProtectedRoute><StreetMap /></ProtectedRoute>} />
                                <Route path="/reports/assign" element={<ProtectedRoute><TechLeadHomePage /></ProtectedRoute>} />
                                <Route path="/reports/tasks" element={<ProtectedRoute><TechAgentHomePage /></ProtectedRoute>} />
                                <Route path="/admin/dashboard" element={<ProtectedRoute><AdminHomePage /></ProtectedRoute>} />
                                <Route path="/officer/dashboard" element={<ProtectedRoute><OrganizationOfficerHomePage /></ProtectedRoute>} />
                            </Routes>
                        </Layout>
                    </BrowserRouter>
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default App;
