import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#003366',
        },
        secondary: {
            main: '#7C1D23',
        },
        background: {
            paper: 'rgba(243, 242, 236, 1)',
            default: '#dbe9ebff',
        },
        text: {
            primary: '#000000',
            secondary: '#555555',
        },
    },
    typography: {
        fontFamily: 'sans-serif' ,
        fontSize: 14,
        h1: {
            fontSize: '2rem',
            fontWeight: 500,
        },
        h2: {
            fontSize: '1.5rem',
            fontWeight: 500,
        },
        body1: {
            fontSize: '1rem',
        },
    },
    spacing: (factor: number) => `${0.5 * factor}rem`, // Custom spacing scale
});

export default theme;