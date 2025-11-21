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
import HomeIcon from "@mui/icons-material/Home"
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import MenuIcon from "@mui/icons-material/Menu";
import {
    Drawer,
    useMediaQuery,
    useTheme
} from "@mui/material";

export default function Header() {
    const navigate = useNavigate();
    const {isAuthenticated, user, logout, role} = useAuth();

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [drawerOpen, setDrawerOpen] = useState(false);


    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (err) {
            console.error('Logout failed', err);
        }
    };

    // compute initials: first + last or fallback
    const initials = (() => {
        const f = user?.first_name?.trim();
        const l = user?.last_name?.trim();
        if (f && l) return (f[0] + l[0]).toUpperCase();
        if (user?.username) return user.username.split(/[\s._-]/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
        return '?';
    })();

    const navItems = [
        //{ icon: <HomeIcon sx={{ mr: 0.8, fontSize: 20 }} />, label: "Home", to: "/" },
        {icon: <HomeIcon sx={{mr: 1}}/>, label: "Home", to: "/"},

        // Map only for users (strict check). adjust isUser condition if you want fallbacks.
        // ...((role === 'USER') ? [{ icon: <MapIcon sx={{ mr: 0.8, fontSize: 20 }} />, label: "Map", to: "/map" }] : []),
        // // Account List only for admins
        // ...((role === 'ADMIN') ? [{ icon: <ListIcon sx={{ mr: 0.8, fontSize: 20 }} />, label: "Account List", to: "/admin/home" }] : []),
    ];

    const handleNavigate = () => {
        if (role === "USER") {
            navigate("/account");
        }
    };

    return (
        <>
            <AppBar position="fixed" sx={{left: 0, right: 0}}>
                <Toolbar sx={{justifyContent: "flex-start"}}>
                    <IconButton
                        size="small"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{mr: 2}}
                    >
                        <img src={logo} alt="Logo" style={{width: "40px"}}/>
                    </IconButton>

                    <Typography
                        variant="h6"
                        className="header-title"
                        sx={{
                            color: "inherit", textDecoration: "none", fontWeight: 800, mr: 4,
                            fontSize: {xs: '1.0rem', sm: '1.25rem'} // Riduzione font su mobile
                        }}
                    >
                        PARTICIPIUM
                    </Typography>

                    {!isMobile && (<Box sx={{display: "flex", gap: 1, alignItems: "center"}}>
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
                    </Box>)}

                    <Box sx={{flexGrow: 1}}/>

                    {!isMobile && !isAuthenticated && (
                        <>
                            <Button
                                color="secondary"
                                variant="contained"
                                size="medium"
                                className="partecipation-button"
                                onClick={() => navigate("/login")}
                            >
                                Login
                            </Button>
                            <Button
                                sx={{color: "inherit", borderColor: "inherit", ml: 2}}
                                variant="outlined"
                                size="medium"
                                className="partecipation-button"
                                onClick={() => navigate("/register")}
                            >
                                Sign Up
                            </Button>
                        </>
                    )}

                    {!isMobile && isAuthenticated && (
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar
                                sx={{width: 36, height: 36, bgcolor: 'secondary.main', fontSize: 16, fontWeight: 600}}
                                onClick={handleNavigate}>
                                {initials}
                            </Avatar>
                            <Stack direction="column" spacing={0} sx={{mr: 2, textAlign: 'left'}}
                                   onClick={handleNavigate}>
                                <Typography sx={{mr: 2, fontWeight: 600, fontSize: 14}}>
                                    {user?.first_name} {user?.last_name}
                                </Typography>
                                <Typography sx={{mr: 2, fontWeight: 400, fontSize: 12}}>
                                    @{user?.username}
                                </Typography>
                            </Stack>
                            <Button
                                color="inherit"
                                variant="outlined"
                                size="small"
                                className="partecipation-button"
                                onClick={handleLogout}
                            >
                                Logout
                            </Button>
                        </Stack>
                    )}
                    {/* MOBILE MENU ICON */}
                    {isMobile && (
                        <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
                            <MenuIcon/>
                        </IconButton>
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
                        borderTopRightRadius: 18,
                        borderBottomRightRadius: 18,
                    }}
                >

                    {/* NOT AUTHENTICATED */}
                    {!isAuthenticated && (
                        <Box sx={{width: "100%", mt: 2}}>
                            <Button
                                fullWidth
                                color="secondary"
                                variant="contained"
                                sx={{
                                    borderRadius: 99,
                                    mb: 2,
                                    py: 1.4,
                                    fontWeight: 600,
                                }}
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
                                sx={{
                                    borderRadius: 99,
                                    py: 1.4,
                                    fontWeight: 600,
                                }}
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
                                <Avatar sx={{bgcolor: "secondary.main", width: 48, height: 48}}>
                                    {initials}
                                </Avatar>

                                <Stack spacing={0}>
                                    <Typography sx={{fontWeight: 600, fontSize: 16}}>
                                        Benvenuto, {user?.first_name}
                                    </Typography>
                                    <Typography variant="body2" sx={{opacity: 0.8}}>
                                        @{user?.username}
                                    </Typography>
                                </Stack>
                            </Stack>

                            <Button
                                fullWidth
                                variant="outlined"
                                color="inherit"
                                className="partecipation-button"
                                sx={{
                                    borderRadius: 99,
                                    py: 1.3,
                                    fontWeight: 600,
                                    mt: 1,
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
