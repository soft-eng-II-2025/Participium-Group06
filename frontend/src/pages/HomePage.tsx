// @ts-ignore
import homepage_image from "../assets/foto_homepage.png"
import React from 'react';
import { Box, Grid, Typography, Button, IconButton } from "@mui/material";
import Slide from '@mui/material/Slide';
import MapPage from "./Map";
import MapIcon from '@mui/icons-material/Map';
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import CloseIcon from "@mui/icons-material/Close";

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showMap, setShowMap] = React.useState(false);

  return (
    <Box
      sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100vw" }}>
      <Grid container sx={{ alignItems: 'center', minHeight: 'calc(100vh - 80px)' }}>
        {/* Left column */}
        <Grid sx={{ width: { xs: '100%', md: '30%' }, px: { xs: 4, md: 8 } }}>
          <Box sx={{ maxWidth: 640 }}>
            <Typography variant="h3" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
              Welcome to
            </Typography>

            <Typography variant="h3" color="secondary" sx={{ fontWeight: 900, mb: 4 }}>
              PARTICIPIUM
            </Typography>

            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 3 }}>
              The platform that connects you with your community to report and resolve local issues.
              Work together to make your neighborhood a better place!
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
              <Button
                color="primary"
                variant="contained"
                className="partecipation-button"
                size="large"
                startIcon={<MapIcon />}
                onClick={() => setShowMap(true)}
              >
                Explore Map
              </Button>
              {!isAuthenticated && (
                <Button
                  color="secondary"
                  variant="contained"
                  size="large"
                  className="partecipation-button"
                  onClick={() => navigate('/register')}
                >
                  JOIN US NOW
                </Button>
              )}
            </Box>
          </Box>
        </Grid>

        {/* Right column - image that transitions into Map */}
        <Grid sx={{ width: { xs: '100%', md: '58%' }, display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' }, pr: { md: 0 } }}>
          <Box
            sx={{
              width: { xs: '80%', md: '100%' },
              maxWidth: 1100,
              display: 'flex',
              justifyContent: { xs: 'center', md: 'flex-end' },
              position: 'relative',
              height: 'calc(100vh - 160px)'
            }}
          >
            <Box sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'visible', borderRadius: 2 }}>
              <Box
                sx={{
                  cursor: 'pointer',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'transparent'
                }}
              >
                <Box
                  component="img"
                  src={homepage_image}
                  alt="Homepage"
                  sx={{
                    width: { xs: '100%', md: '90%' },
                    maxWidth: { md: 920 },
                    height: 'auto',
                    display: 'block',
                    transform: { md: 'scale(1.05)', lg: 'scale(1.08)' },
                    transformOrigin: 'right center',
                    mr: { md: -6 },
                  }}
                />

              </Box>

              <Slide direction="up" in={showMap} mountOnEnter unmountOnExit>
                <Box sx={{ position: 'fixed', left: 0, right: 0, bottom: 0, top: '64px', zIndex: 1200, bgcolor: 'background.paper' }}>
                  <IconButton
                    onClick={() => setShowMap(false)}
                    sx={{
                      position: 'absolute',
                      right: 13,
                      top: 64,
                      zIndex: 1201,
                      backgroundColor: 'primary.main', // Standard MUI Blue
                      color: 'white',                  // White Icon
                      '&:hover': {
                        backgroundColor: 'primary.dark', // Darker blue on hover
                      },
                      boxShadow: 2,                     // Optional: adds a bit of depth
                    }}
                    size="large"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                  <Box sx={{ width: '100%', height: '100%' }}>
                    <MapPage />
                  </Box>
                </Box>
              </Slide>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HomePage;
