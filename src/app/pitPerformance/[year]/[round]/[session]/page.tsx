"use client";

import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell, LabelList, ReferenceLine } from "recharts";
import { Box, Color, colors, Typography, ThemeProvider, CssBaseline, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { storage } from "../../../../firebaseConfig";
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { json } from "stream/consumers";
import { LapData } from "../../../../classes/lapData";
import { DriverData } from "../../../../classes/driverData";
import { exo2, exo2Regular } from "../../../../styles";
import darkTheme from "../../../../theme";
import Navbar from "../../../../components/Navbar";
import PageView from "../../../../components/PageView";
import { fetchSessionData } from "../../../../utils/fetchSessionData";
import { useParams } from "next/navigation";

class PitPerformance {
  constructor(public team: string, public pitTime: number, public color: string) {}
}

class Bounds {
    constructor(public minY: number, public maxY: number) {}

    toString() {return `Bounds(minY: ${this.minY}, maxY: ${this.maxY})`}
}



const PitPerformanceChart = () => {
    const [driverData, setDriverData] = useState<PitPerformance[]>([]);
    const [driverBounds, setDriverBounds] = useState<Bounds>(new Bounds(0, 10));

    const [teamsData, setTeamsData] = useState<PitPerformance[]>([]);
    const [teamsBounds, setTeamsBounds] = useState<Bounds>(new Bounds(0, 10));


    const params = useParams();
    const year = params.year as string;
    const round = decodeURIComponent(params.round as string);
    const session = decodeURIComponent(params.session as string);

    const [dataType, setDataType] = useState<"teams" | "drivers">("teams");

    const handleDataChange = (_event: React.MouseEvent<HTMLElement>, newValue: "teams" | "drivers") => {
        if (newValue !== null) setDataType(newValue);
    };

    useEffect(() => {
      const fetchPitData = async () => {
        try {
            const sessionData = await fetchSessionData(year, round, session);

            let allLapsData = sessionData.allLapsData;
            let driversData = sessionData.driversData;
            
            let pitsTime = [];
            let pitsCount = [];
            for (let i = 0; i < allLapsData.length; i++)
            {
                let lapsData = allLapsData[i];
                let totalPit = 0;
                let pitTimes = 0;
                for (let j = 1; j < lapsData.length; j++)
                {
                    if (lapsData[j].pitOutTime != -1 && lapsData[j - 1].pitInTime != -1)
                    {
                        let pitTime = lapsData[j].pitOutTime - lapsData[j - 1].pitInTime;
                        pitTimes += 1;
                        totalPit += pitTime;
                    }
                }
                pitsTime.push(totalPit);
                pitsCount.push(pitTimes);
            }

            let teamsPitsTime = [];
            let teamsPitsCount = [];
            let teamsIndex = new Map();
            let teamsDataT = [];

            for (let i = 0; i < pitsTime.length; i++) {
                const teamName = driversData[i].teamName;

                if (teamsIndex.has(teamName))
                {
                    const teamIndex = teamsIndex.get(teamName);
                    teamsPitsTime[teamIndex] += pitsTime[i];
                    teamsPitsCount[teamIndex] += pitsCount[i];
                }
                else
                {
                    const newIndex = teamsPitsTime.length;
                    teamsIndex.set(teamName, newIndex);
                    teamsPitsTime.push(pitsTime[i]);
                    teamsPitsCount.push(pitsCount[i]);
                    teamsDataT.push(driversData[i]);
                }
            }

            console.log(teamsPitsTime);
            console.log(teamsPitsCount);
            console.log(teamsIndex);

            let driverPitPerformance = [];
            let teamsPitPerformance = [];

            let driverBound = new Bounds(999, 0);
            let teamsPitPerformanceBounds = new Bounds(999, 0);

            for (let i = 0; i < pitsTime.length; i++)
            {
                if (pitsCount[i] > 0)
                {
                    let pitTime = pitsTime[i]/pitsCount[i];
                    if (Math.floor(pitTime - 1) < driverBound.minY)
                    {
                        driverBound.minY = Math.floor(pitTime - 1);
                    }
                    if (Math.ceil(pitTime + 1) > driverBound.maxY)
                    {
                        driverBound.maxY = Math.ceil(pitTime + 1);
                    }
                    driverPitPerformance.push(new PitPerformance(driversData[i].lastName.slice(0,3).toUpperCase(), pitsTime[i]/pitsCount[i], "#" + driversData[i].teamColour));
                }
            }

            for (let i = 0; i < teamsPitsTime.length; i++)
            {
                if (teamsPitsCount[i] > 0)
                {
                    let pitTime = teamsPitsTime[i]/teamsPitsCount[i];
                    if (Math.floor(pitTime - 1) < teamsPitPerformanceBounds.minY)
                    {
                        teamsPitPerformanceBounds.minY = Math.floor(pitTime - 1);
                    }
                    if (Math.ceil(pitTime + 1) > teamsPitPerformanceBounds.maxY)
                    {
                        teamsPitPerformanceBounds.maxY = Math.ceil(pitTime + 1);
                    }
                    teamsPitPerformance.push(new PitPerformance(teamsDataT[i].teamName, teamsPitsTime[i]/teamsPitsCount[i], "#" + teamsDataT[i].teamColour));
                
                }
            }

            driverPitPerformance.sort((a, b) => a.pitTime - b.pitTime);
            teamsPitPerformance.sort((a, b) => a.pitTime - b.pitTime);

            console.log(driverBound);

            setDriverData(driverPitPerformance);
            setDriverBounds(driverBound);
            
            setTeamsData(teamsPitPerformance);
            setTeamsBounds(teamsPitPerformanceBounds);
        } catch (error) {
          console.error("Error fetching pit performance data:", error);
        }
      };
  
      fetchPitData();
    }, []);

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Navbar />
            <Box
                sx={{
                    width: "100vw",
                    height: "calc(100vh - 64px)",
                    textAlign: "center",
                    padding: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignItems: "center",
                    color: "#E3E3E3",
                }}
            >
                <Typography
                    variant="h4"
                    gutterBottom
                    sx={{
                        fontFamily: exo2.style.fontFamily,
                        fontWeight: "700",
                        letterSpacing: 1.2,
                        fontSize: 42,
                        marginTop: 1,
                        marginBottom: 1,
                    }}
                >
                    Pit Stop Performance
                </Typography>
                <ToggleButtonGroup
                    value={dataType}
                    exclusive
                    onChange={handleDataChange}
                    sx={{
                        mb: 1,
                        border: "1px solid #AAAAAA",
                        "& .MuiToggleButton-root": {
                            border: "1px solid #AAAAAA",
                            "&.Mui-selected": {
                                border: "1px solid #AAAAAA",
                            },
                        },
                    }}
                >
                    <ToggleButton value="teams">Teams</ToggleButton>
                    <ToggleButton value="drivers">Drivers</ToggleButton>
                </ToggleButtonGroup>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={dataType === "teams" ? teamsData : driverData}
                        margin={{ top: 10, right: 20, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="6 6" vertical={false} />
                        <XAxis
                            dataKey="team"
                            fontFamily={exo2.style.fontFamily}
                            fontSize={16}
                            fontWeight="600"
                            style={{ fill: "#E2E2E2" }}
                            tickCount={0}
                        />
                        <YAxis
                            fontFamily={exo2.style.fontFamily}
                            fontSize={18}
                            fontWeight="500"
                            style={{ fill: "#E2E2E2" }}
                            label={{
                                value: "Average Pit Stop Time (s)",
                                angle: -90,
                                position: "insideLeft",
                                style: { fontFamily: exo2.style.fontFamily, fontWeight: "600" },
                                fill: "#E2E2E2",
                                dy: 70,
                            }}
                            domain={[
                                (dataType === "teams" ? teamsBounds : driverBounds).minY,
                                (dataType === "teams" ? teamsBounds : driverBounds).maxY,
                            ]}
                            tickCount={Math.ceil(
                                (dataType === "teams" ? teamsBounds : driverBounds).maxY -
                                (dataType === "teams" ? teamsBounds : driverBounds).minY
                            ) + 1}
                            interval={0}
                            tickFormatter={(value) => value.toFixed(0)}
                        />
                        <Bar dataKey="pitTime" radius={[14, 14, 0, 0]}>
                            {(dataType === "teams" ? teamsData : driverData).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                            <LabelList
                                dataKey="pitTime"
                                position="top"
                                formatter={(value: number) => value.toFixed(2)}
                                fontFamily={exo2Regular.style.fontFamily}
                                fontWeight="600"
                                fontSize={20}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </ThemeProvider>
    );
};

export default PitPerformanceChart;
