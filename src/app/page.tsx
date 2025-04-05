"use client";

import { useState } from "react";
//import styles from "./Home.module.css";
import darkTheme from "./theme";
import { exo2, exo2Regular } from "./styles";
import { CssBaseline, ThemeProvider, Stack, Typography } from "@mui/material";
import { useStore } from "./store/store";



import Navbar from "./components/Navbar";
import PageView from "./components/PageView";

export default function Home() {
  const setFullLapData = useStore((state) => state.setFullLapData);
  const setLapLoadData = useStore((state) => state.setLapLoadData);
  
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Navbar />
      
      {/* Page Title */}
      <Stack alignItems="center" marginTop="15px">
      <Typography 
        variant="h4" 
        sx={{ fontFamily: exo2.style.fontFamily, fontWeight: "700", letterSpacing: 1.2, fontSize: 42 }}
      >
        F1-Metrics
      </Typography>
      <Typography 
        variant="h4" 
        sx={{ fontFamily: exo2Regular.style.fontFamily, letterSpacing: 1.2, fontSize: 22, color:  "#AAAAAA"}}
      >
        Analyse anywhere
      </Typography>
      </Stack>

      {/* Centered Wrap Layout for PageView Components */}
      <Stack
        direction="row"
        flexWrap="wrap"
        justifyContent="center"
        gap={2} // Adds spacing between items
        padding={2}
      >
        <PageView 
          url="https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Images%2FspeedTime.png?alt=media&token=c9120dbc-996d-4475-b429-978036605aab"
          description="Analyse each lap's speed, throttle and braking, as well as comparing multiple drivers"
          title="Speed Distance"
          pageLink="/speedDistance"
          onClick={() => {setFullLapData([]); setLapLoadData([]);}}
        />
        <PageView 
          url="https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Images%2FlapStrengths.png?alt=media&token=e4f50fa2-ec8b-45ad-b2b0-99d2ecc78743"
          description="View a track map showing where each driver is fastest"
          title="Track Map"
          pageLink=""
          onClick={() => console.log("Track Map Clicked")}
        />
        <PageView 
          url="https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Images%2FLapTimesChart.jpg?alt=media&token=e1cfcb34-7642-42a2-8871-82ed4056d78d"
          description="View and analyse each drivers lap times throughout any session"
          title="Lap Time Chart"
          pageLink="/lapTimesChart"
          onClick={() => console.log("Track Map Clicked")}
        />
        <PageView 
          url="https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Images%2FSpeedCharts.jpg?alt=media&token=e762fec9-d7c0-4355-a73d-20ad2ca0f3b2"
          description="Analyse car performance at max speeds, min speeds and even throttle application"
          title="Speed Bar Charts"
          pageLink="/speedsChart"
          onClick={() => console.log("Track Map Clicked")}
        />
        <PageView 
          url="https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Images%2FPitPerformance.jpg?alt=media&token=588e4765-381f-4431-ad39-0ac28618e0b9"
          description="Find out which pit crew performed best"
          title="Pit Performance Chart"
          pageLink="/pitPerformance"
          onClick={() => {
            console.log("Track Map Clicked"); 
          }}
        />
        <PageView 
          url="https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Images%2FracePaceBoxPlot.png?alt=media&token=542e5dfa-738d-40e1-a6e3-845cdceaa65b"
          description="Analyse which drivers had the best pace in the race"
          title="Race Pace Box Plot"
          pageLink=""
          onClick={() => console.log("Track Map Clicked")}
        />
        <PageView 
          url="https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Images%2FraceStrategy.png?alt=media&token=03d6f694-de5b-4570-acf1-5d4dd609a751"
          description="Find out who boxed for which compound"
          title="Race Strategy View"
          pageLink=""
          onClick={() => console.log("Track Map Clicked")}
        />
      </Stack>
    </ThemeProvider>
  );
}