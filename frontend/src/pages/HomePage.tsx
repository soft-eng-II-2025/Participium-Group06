// @ts-ignore
import homepage_image from "../assets/foto_homepage.png"
import { Box, Container, Grid, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <Container sx={{ mt: 12, mb: 4 }}>
      <Grid
        container
      >
        {/* Left column */}
        <Grid sx={{ width: '50%', pr: 4 }}>
          <Grid sx={{ pr: 4 }}>
            <Typography
              variant="h3"
              color="primary"
              sx={{ fontWeight: 600, mb: 1, mt: 4 }}
            >
              Welcome to
            </Typography>

            <Typography
              variant="h3"
              color="secondary"
              sx={{ fontWeight: 900, mb: 4 }}
            >
              PARTICIPIUM
            </Typography>
          </Grid>
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
        </Grid>

        {/* Right column */}
        <Grid sx={{ width: '50%' }}>
          <img
            src={homepage_image}
            alt="Homepage"
            className="homeImage"
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default HomePage;
