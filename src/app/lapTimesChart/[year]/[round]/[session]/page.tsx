"use client";

import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell, LabelList, ReferenceLine } from "recharts";
import { Box, Typography, ThemeProvider, CssBaseline, ToggleButtonGroup, ToggleButton, Stack, CircularProgress, LinearProgress, Tab, Tabs } from "@mui/material";
import { LapData } from "../../../../classes/lapData";
import { DriverData } from "../../../../classes/driverData";
import { exo2, exo2Regular } from "../../../../styles";
import darkTheme from "../../../../theme";
import Navbar from "../../../../components/Navbar";
import { fetchSessionData } from "../../../../utils/fetchSessionData";
import { useParams } from "next/navigation";



const SpeedsChart = () => {
    const [lapsData, setLapsData] = useState<LapData[][]>([[]]);
    const [driversData, setDriversData] = useState<DriverData[]>([new DriverData("Loading", "...", "Loading...", "#AAAAAA", 1, -1, -1, -1, 0, -1, 0, "Loading...")]);
    const [driverPositions, setDriverPositions] = useState<number[]>([0]); // [0] contains index of first place
    const [driversDisplay, setDriversDisplay] = useState<string[]>(["Loading..."]);
    const [currentDriverIndex, setDriverIndex] = useState<number>(0);
    const [driverChosenVal, setDriverChosen] = useState<string>("Loading...");

    
    const handleDriverChange = (event: React.SyntheticEvent, value: any) => {
        if (value !== null) setDriverChosen(value);
    };


    const params = useParams();
    const year = params.year as string;
    const round = decodeURIComponent(params.round as string);
    const session = decodeURIComponent(params.session as string);

    useEffect(() => {
      const fetchLaps = async () => {
        try {
            const sessionData = await fetchSessionData(year, round, session);

            let lapsData = sessionData.allLapsData;
            let driverData = sessionData.driversData;

            console.log(lapsData);
            console.log(driverData);

            let calculatePositions = true;

            for (let i = 0; i < driverData.length; i++)
            {
                if (driverData[i].position != -1)
                {
                    calculatePositions = false;
                }
            }

            console.log(calculatePositions);

            let driverPositionsEach = [];

            if (calculatePositions)
            {
                let minLapTime = [];
                for (let i = 0; i < lapsData.length; i++)
                {
                    let currentMinLap = 999;
                    for (let j = 0; j < lapsData[i].length; j++)
                    {
                        let lap = lapsData[i][j];
                        if (!lap.deleted && lap.lapTime != -1)
                        {
                            if (lap.lapTime < currentMinLap)
                            {
                                currentMinLap = lap.lapTime;
                            }
                        }
                    }
                    minLapTime.push([currentMinLap, i]);
                }

                minLapTime.sort((a, b) => a[0] - b[0]);

                console.log(minLapTime);

                for (let i = 0; i < minLapTime.length; i++)
                {
                    driverData[minLapTime[i][1]].position = i + 1;
                    driverPositionsEach.push(minLapTime[i][1]);
                }
            }
            else
            {
                for (let i = 0; i < driverData.length; i++)
                {
                    driverPositionsEach.push(-1);
                }
                for (let i = 0; i < driverData.length; i++)
                {
                    driverPositionsEach[driverData[i].position - 1] = i;
                }
            }

            console.log(driverData);
            console.log(driverPositionsEach);

            let driversDesc = [];

            for (let i = 0; i < driverPositionsEach.length; i++)
            {
                driversDesc.push(`${i + 1}) ${driverData[driverPositionsEach[i]].firstName} ${driverData[driverPositionsEach[i]].lastName}`);
            }

            if (driverPositionsEach.length > 0)
            {
                setDriverChosen(`1) ${driverData[driverPositionsEach[0]].firstName} ${driverData[driverPositionsEach[0]].lastName}`);
            }

            console.log(driversDesc);

            setLapsData(lapsData);
            setDriversData(driverData);
            setDriverPositions(driverPositionsEach);
            setDriversDisplay(driversDesc);
        } catch (error) {
          console.error("Error fetching pit performance data:", error);
        }
      };
  
      fetchLaps();
    }, []);

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Navbar />

            <Tabs
                value={driverChosenVal}
                onChange={handleDriverChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{mt:2}}
            >
                {driversDisplay.map((driver) => (
                    <Tab key={driver} label={driver} value={driver} />
                ))}
            </Tabs>
            
        </ThemeProvider>
    );
};

export default SpeedsChart;
