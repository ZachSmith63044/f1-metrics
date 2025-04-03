import { createTheme } from "@mui/material/styles";
import { exo2 } from "./styles";

const darkTheme = createTheme({
  palette: {
    mode: "dark", // Enables dark mode
    primary: {
      main: "#94c1ff", // Bright red
    },
    secondary: {
      main: "#0A84FF", // Neon blue
    },
    background: {
      default: "#3C3C3C", // 4A4A4A
      //default: "#3C3C3C", // Very dark gray
      paper: "#1E1E1E", // Slightly lighter gray
    },
    text: {
      primary: "#EAEAEA", // Light gray
      secondary: "#A0A0A0", // Dim gray
    },
    success: {
      main: "#4CAF50", // Green
    },
    error: {
      main: "#FF453A", // Red
    },
    divider: "#292929", // Soft gray for dividers
  },
  typography: {
    fontFamily: exo2.style.fontFamily, // Default font family
  },
});

export default darkTheme;