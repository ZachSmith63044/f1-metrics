"use client";

import { useState } from "react";
//import styles from "./Home.module.css";
import darkTheme from "./theme";
import { exo2, exo2Regular } from "./styles";
import { CssBaseline, ThemeProvider, Stack, Typography } from "@mui/material";



import Navbar from "./components/Navbar";
import PageView from "./components/PageView";

export default function Home() {
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
          title="Speed Time"
          pageLink=""
          onClick={() => console.log("Speed Time Clicked")}
        />
        <PageView 
          url="https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Images%2FlapStrengths.png?alt=media&token=e4f50fa2-ec8b-45ad-b2b0-99d2ecc78743"
          description="View a track map showing where each driver is fastest"
          title="Track Map"
          pageLink=""
          onClick={() => console.log("Track Map Clicked")}
        />
        <PageView 
          url="https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Images%2FlapTimeView.png?alt=media&token=72d06d3f-1552-4914-a416-c9f611aafcfb"
          description="View and analyse each drivers lap times throughout any session"
          title="Lap Time Chart"
          pageLink=""
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
          url="https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Images%2FPitPerformance.jpg?alt=media&token=99d80513-32c4-4147-abfb-f7e1164c4699"
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
          url="https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Images%2FstartAnalysis.png?alt=media&token=1f8e6652-c60d-4f98-a8ea-cd328ec36e61"
          description="Analyse who got off the line best, and in which phase they gained an advantage"
          title="Start Analysis"
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
        <PageView 
          url="https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Images%2FraceMaxSpeeds.png?alt=media&token=7a28aff7-7880-4bcd-93cb-23f7cf88a86a"
          description="Find the fastest (and slowest) cars in a straight line"
          title="Race Min/Max Speeds"
          pageLink=""
          onClick={() => console.log("Track Map Clicked")}
        />
      </Stack>
    </ThemeProvider>
  );
}