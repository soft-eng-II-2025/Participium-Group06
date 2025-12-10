import React, {useState} from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import logo from "../assets/logo.png";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../contexts/AuthContext";
import HomeIcon from "@mui/icons-material/Home";
import AssignmentIcon from "@mui/icons-material/Assignment"; // <-- NEW ICON
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsMenu from "../components/NotificationsMenu";
import {Drawer, useMediaQuery, useTheme} from "@mui/material";

export default function Header() {
    const navigate = useNavigate();
    const {isAuthenticated, user, logout, role, isExternal, companyName} = useAuth();

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/");
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    // initials for avatar
    const initials = (() => {
        const f = user?.first_name?.trim();
        const l = user?.last_name?.trim();
        if (f && l) return (f[0] + l[0]).toUpperCase();
        if (user?.username)
            return user.username
                .split(/[\s._-]/)
                .map((s) => s[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
        return "?";
    })();

    // NAV ITEMS (Desktop)
    const navItems = [
        {icon: <HomeIcon sx={{mr: 1}}/>, label: "Home", to: "/"},

        // Only for regular users
        ...(role === "USER"
            ? [
                {
                    icon: <AssignmentIcon sx={{mr: 1}}/>,
                    label: "My Reports",
                    to: "/my-reports",
                },
            ]
            : []),
    ];

    const handleNavigate = () => {
        if (role === "USER") {
            navigate("/account");
        }
    };

    return (
        <>
            <AppBar position="fixed" sx={{
                left: 0,
                right: 0,
                // Se isExternal è true, usa il secondary
                // Altrimenti, usa undefined che di default è primary
                backgroundColor: isExternal ? theme.palette.secondary.dark : undefined,
            }}
            >
                <Toolbar sx={{justifyContent: "flex-start"}}>

                    <IconButton size="small" edge="start" color="inherit" sx={{mr: 2}}
                                onClick={() => navigate("/")}>
                        <img src={logo} alt="Logo" style={{width: "40px"}}/>
                    </IconButton>

                    <Typography
                        variant="h6"
                        sx={{
                            color: "inherit",
                            fontWeight: 800,
                            mr: 4,
                            fontSize: {xs: "1.0rem", sm: "1.25rem"},
                        }}
                    >
                        PARTICIPIUM
                    </Typography>

                    {/* DESKTOP NAV */}
                    {!isMobile && (
                        <Box sx={{display: "flex", gap: 1, alignItems: "center"}}>
                            {navItems.map((item) => (
                                <Button
                                    key={item.to}
                                    color="inherit"
                                    onClick={() => navigate(item.to)}
                                    sx={{textTransform: "none", color: "inherit", mr: 1}}
                                >
                                    {item.icon}
                                    {item.label}
                                </Button>
                            ))}
                        </Box>
                    )}

                    <Box sx={{flexGrow: 1}}/>

                    {/* DESKTOP – NOT LOGGED IN */}
                    {!isMobile && !isAuthenticated && (
                        <>
                            <Button
                                color="secondary"
                                variant="contained"
                                className="partecipation-button"
                                size="medium"
                                onClick={() => navigate("/login")}
                            >
                                Login
                            </Button>
                            <Button
                                sx={{color: "inherit", borderColor: "inherit", ml: 2}}
                                variant="outlined"
                                className="partecipation-button"
                                size="medium"
                                onClick={() => navigate("/register")}
                            >
                                Sign Up
                            </Button>
                        </>
                    )}

                    {/* DESKTOP – LOGGED IN */}
                    {!isMobile && isAuthenticated && (
                        <Stack direction="row" spacing={2} alignItems="center">
                            {role == "USER" && <NotificationsMenu/>}
                            <Avatar
                                src={`http://localhost:3000/api/users/uploads/${user?.photo}` || undefined}
                                sx={{width: 36, height: 36, bgcolor: 'secondary.main', fontSize: 16, fontWeight: 600}}
                                onClick={handleNavigate}>
                                {!user?.photo && initials}
                            </Avatar>
                            <Stack spacing={0} onClick={handleNavigate}>
                                <Typography sx={{fontWeight: 600, fontSize: 14}}>
                                    {user?.first_name} {user?.last_name}
                                </Typography>
                                {isExternal ? (
                                    <Typography sx={{fontWeight: 400, fontSize: 12}}>
                                        {companyName}
                                    </Typography>
                                ) : (
                                    <Typography sx={{fontWeight: 400, fontSize: 12}}>
                                        @{user?.username}
                                    </Typography>
                                )}
                            </Stack>
                            <Button
                                color="inherit"
                                variant="outlined"
                                size="small"
                                onClick={handleLogout}
                            >
                                Logout
                            </Button>
                        </Stack>
                    )}

                    {/* MOBILE MENU BUTTON */}
                    {isMobile && (
                        <>
                            {role == "USER" && <NotificationsMenu/>}
                            <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
                                <MenuIcon/>
                            </IconButton>
                        </>
                    )}

                </Toolbar>
            </AppBar>

            {/* MOBILE DRAWER */}
            <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <Box
                    sx={{
                        width: 280,
                        backgroundColor: theme.palette.background.paper,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        p: 2,
                    }}
                >
                    {/* NOT AUTHENTICATED */}
                    {!isAuthenticated && (
                        <Box sx={{width: "100%", mt: 2}}>
                            <Button
                                fullWidth
                                color="secondary"
                                variant="contained"
                                sx={{borderRadius: 99, mb: 2, py: 1.4, fontWeight: 600}}
                                onClick={() => {
                                    setDrawerOpen(false);
                                    navigate("/login");
                                }}
                            >
                                Login
                            </Button>

                            <Button
                                fullWidth
                                variant="outlined"
                                sx={{borderRadius: 99, py: 1.4, fontWeight: 600}}
                                onClick={() => {
                                    setDrawerOpen(false);
                                    navigate("/register");
                                }}
                            >
                                Sign Up
                            </Button>
                        </Box>
                    )}

                    {/* AUTHENTICATED */}
                    {isAuthenticated && (
                        <Box sx={{width: "100%", mt: 2}}>
                            <Stack direction="row" spacing={2} alignItems="center" sx={{mb: 2}}>
                                <Avatar
                                    src={user?.photo ? `http://localhost:3000/api/users/uploads/${user.photo}` : undefined}
                                    sx={{bgcolor: "secondary.main", width: 48, height: 48}}>
                                    {!user?.photo && initials}
                                </Avatar>

                                <Stack spacing={0} onClick={() => {
                                    handleNavigate();
                                    setDrawerOpen(false)
                                }}>
                                    <Typography sx={{fontWeight: 600, fontSize: 16}}>
                                        Welcome, {user?.first_name}
                                    </Typography>
                                    <Typography variant="body2" sx={{opacity: 0.8}}>
                                        @{user?.username}
                                    </Typography>
                                </Stack>
                            </Stack>

                            {/* MOBILE: MY REPORTS */}
                            {role === "USER" && (
                                <Button
                                    fullWidth
                                    variant="text"
                                    sx={{
                                        borderRadius: 99,
                                        py: 1.3,
                                        fontWeight: 600,
                                        mt: 1,
                                        justifyContent: "flex-start",
                                    }}
                                    onClick={() => {
                                        setDrawerOpen(false);
                                        navigate("/my-reports");
                                    }}
                                >
                                    <AssignmentIcon sx={{mr: 1}}/>
                                    My Reports
                                </Button>
                            )}

                            {/* LOGOUT */}
                            <Button
                                fullWidth
                                variant="outlined"
                                color="inherit"
                                sx={{
                                    borderRadius: 99,
                                    py: 1.3,
                                    fontWeight: 600,
                                    mt: 3,
                                }}
                                onClick={() => {
                                    setDrawerOpen(false);
                                    handleLogout();
                                }}
                            >
                                Logout
                            </Button>
                        </Box>
                    )}
                </Box>
            </Drawer>
        </>
    );
}
