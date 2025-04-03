"use client";

import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, ThemeProvider, CssBaseline, Tab, Tabs, Checkbox, ToggleButtonGroup, ToggleButton, Button } from "@mui/material";
import darkTheme from "../theme";
import Navbar from "../components/Navbar";
import { fetchTelemetryData } from "../utils/fetchTelemetryData";


const SpeedDistance = () => {
    

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Navbar />
            
            
        </ThemeProvider>
    );
};

export default SpeedDistance;
