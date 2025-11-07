// theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2", // blu principale
    },
    secondary: {
      main: "#f9a825", // giallo secondario
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
    text: {
      primary: "#333333",
      secondary: "#555555",
    },
  },
  typography: {
    fontFamily: "'Roboto', sans-serif",
    h4: {
      fontWeight: 700,
      letterSpacing: "0.5px",
    },
    h6: {
      fontWeight: 600,
      letterSpacing: "0.5px",
    },
    body1: {
      fontSize: "1rem",
    },
  },
});

export default theme;