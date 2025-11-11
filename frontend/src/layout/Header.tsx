// ...existing code...
import React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
// @ts-ignore
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home"
import Icon from "@mui/material/Icon";

export default function Header() {
  const navigate = useNavigate();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" sx={{ width: "100%" }}>
        <Toolbar sx={{ justifyContent: "flex-start" }}>
          <IconButton
            size="small"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <img src={logo} alt="Logo" style={{ width: "40px" }} />
          </IconButton>

          <Typography
            variant="h6"
            className="header-title"
            sx={{ color: "inherit", textDecoration: "none", fontWeight: 800, mr: 2 }}
          >
            PARTICIPIUM
          </Typography>


          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {[
              { label: "Home", to: "/" },
            ].map((item) => (

              <Button
                key={item.to}
                color="inherit"
                onClick={() => navigate(item.to)}
                sx={{ textTransform: "none", color: "inherit", mx: 3 }}
              >
                <HomeIcon sx={{ mr: 0.8, fontSize: 20 }} />
                {item.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            color="secondary"
            variant="contained"
            size="medium"
            className="partecipation-button"
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
// ...existing code...