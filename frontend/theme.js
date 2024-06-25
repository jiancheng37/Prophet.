import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  typography: {
    fontFamily: 'Poppins, sans-serif',
  },
  palette: {
    primary: {
      main: '#ffdaeb',
    },
    secondary: {
      main: '#dd7aa6',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
          body {
            background-image: url('/pattern.png'), linear-gradient(30deg, #000d18 0%, #00396a 100%);
            background-repeat: no-repeat, no-repeat;
            background-position: center, center;
            background-size: cover, cover;
            background-attachment: fixed, fixed;
          } 
        `,
    },
  },
})
export default theme
