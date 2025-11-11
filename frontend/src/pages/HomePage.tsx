// @ts-ignore
import homepage_image from "../assets/foto_homepage.png"
import { Box, Grid, Typography, Button } from "@mui/material";

import { useNavigate } from "react-router-dom";
import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();

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

            <Button
              color="secondary"
              variant="contained"
              size="large"
              className="partecipation-button"
              onClick={() => navigate('/login')}
            >
              JOIN US NOW
            </Button>
          </Box>
        </Grid>

        {/* Right column */}
        <Grid sx={{ width: { xs: '100%', md: '58%' }, display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' }, pr: { md: 0 } }}>
          <Box
            sx={{
              width: { xs: '80%', md: '100%' },
              maxWidth: 1100,
              display: 'flex',
              justifyContent: { xs: 'center', md: 'flex-end' },
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
        </Grid>
      </Grid>
    </Box>
  );
};

export default HomePage;
