"use client";

import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell, LabelList, ReferenceLine } from "recharts";
import { Box, Typography, ThemeProvider, CssBaseline, ToggleButtonGroup, ToggleButton, Stack, LinearProgress } from "@mui/material";
import { LapData } from "../classes/lapData";
import { DriverData } from "../classes/driverData";
import { exo2, exo2Regular } from "../styles";
import darkTheme from "../theme";
import Navbar from "../components/Navbar";
import { fetchSessionData } from "../utils/fetchSessionData";
import { useParams } from "next/navigation";

class SpeedsPerformance {
    constructor(public team: string, public value: number, public color: string) { }
}

class Bounds {
    constructor(public minY: number, public maxY: number) { }

    toString() { return `Bounds(minY: ${this.minY}, maxY: ${this.maxY})` }
}


type SpeedsChartProps = {
    laps: LapData[][];
    drivers: DriverData[];
};

const SpeedsChart: React.FC<SpeedsChartProps> = ({ laps, drivers }) => {
    const [minSpeedDrivers, setMinSpeedDriverData] = useState<SpeedsPerformance[]>([]);
    const [minSpeedDriverBounds, setMinSpeedDriverBounds] = useState<Bounds>(new Bounds(0, 10));
    const [minSpeedTeams, setMinSpeedTeamData] = useState<SpeedsPerformance[]>([]);
    const [minSpeedTeamBounds, setMinSpeedTeamBounds] = useState<Bounds>(new Bounds(0, 10));

    const [maxSpeedDrivers, setMaxSpeedDriverData] = useState<SpeedsPerformance[]>([]);
    const [maxSpeedDriverBounds, setMaxSpeedDriverBounds] = useState<Bounds>(new Bounds(0, 10));
    const [maxSpeedTeams, setMaxSpeedTeamData] = useState<SpeedsPerformance[]>([]);
    const [maxSpeedTeamBounds, setMaxSpeedTeamBounds] = useState<Bounds>(new Bounds(0, 10));

    const [throttleDrivers, setThrottleDriverData] = useState<SpeedsPerformance[]>([]);
    const [throttleDriverBounds, setThrottleDriverBounds] = useState<Bounds>(new Bounds(0, 10));
    const [throttleTeams, setThrottleTeamData] = useState<SpeedsPerformance[]>([]);
    const [throttleTeamBounds, setThrottleTeamBounds] = useState<Bounds>(new Bounds(0, 10));

    const [dataType, setDataType] = useState<"teams" | "drivers">("teams");

    const handleDataChange = (_event: React.MouseEvent<HTMLElement>, newValue: "teams" | "drivers") => {
        if (newValue !== null) setDataType(newValue);
    };

    const [chartType, setChartType] = useState<"min" | "max" | "throttle">("min");

    const handleChartChange = (_event: React.MouseEvent<HTMLElement>, newValue: "min" | "max" | "throttle") => {
        if (newValue !== null) setChartType(newValue);
    };

    useEffect(() => {
        const fetchSpeeds = async () => {
            try {
                
                console.log(laps);
                console.log(drivers);

                let allLapsData = [...laps];
                let driversData = [...drivers];

                let fastestLapsData = [];

                for (let i = 0; i < allLapsData.length; i++) {
                    let lapTimeData: LapData = new LapData(0, 999, 0, 0, 0, 0, "SOFT", 0, true, false, true, 0, 0, 0, 0, false, -1, -1, 0);
                    for (let j = 0; j < allLapsData[i].length; j++) {
                        const lapData = allLapsData[i][j];
                        if (lapData.lapTime != -1 && !lapData.deleted) {
                            if (lapData.lapTime < lapTimeData.lapTime) {
                                lapTimeData = lapData;
                            }
                        }
                    }

                    fastestLapsData.push(lapTimeData);
                }



                for (let i = fastestLapsData.length - 1; i > -1; i--) {
                    if (fastestLapsData[i].maxSpeed < 300 || fastestLapsData[i].minSpeed < 40 || fastestLapsData[i].throttle < 0.25) {
                        fastestLapsData.splice(i, 1);
                        driversData.splice(i, 1);
                    }
                }


                let fastestLapsTeams: LapData[] = [];
                let teamsData: DriverData[] = [];
                let teamsIndex = new Map<string, number>();

                for (let i = 0; i < fastestLapsData.length; i++) {
                    const teamName = driversData[i].teamName;

                    if (teamsIndex.has(teamName)) {
                        const teamIdx = teamsIndex.get(teamName)!;
                        if (fastestLapsTeams[teamIdx].lapTime > fastestLapsData[i].lapTime) {
                            fastestLapsTeams[teamIdx] = fastestLapsData[i];
                        }
                    } else {
                        const newIdx = fastestLapsTeams.length; // Index where the new lap will be added
                        fastestLapsTeams.push(fastestLapsData[i]);
                        teamsIndex.set(teamName, newIdx);
                        teamsData.push(driversData[i]);
                    }
                }

                let minDriversSpeeds = [];
                let minDriversSpeedBounds = new Bounds(999, 0);
                let maxDriversSpeeds = [];
                let maxDriversSpeedBounds = new Bounds(999, 0);
                let throttleDrivers = [];
                let throttleDriversBounds = new Bounds(999, 0);

                for (let i = 0; i < fastestLapsData.length; i++) {
                    let minSpeed = new SpeedsPerformance(driversData[i].lastName.slice(0, 3).toUpperCase(), fastestLapsData[i].minSpeed, driversData[i].teamColour);
                    minDriversSpeeds.push(minSpeed);
                    if (minSpeed.value - 1 < minDriversSpeedBounds.minY) {
                        minDriversSpeedBounds.minY = minSpeed.value - 1;
                    }
                    if (minSpeed.value + 1 > minDriversSpeedBounds.maxY) {
                        minDriversSpeedBounds.maxY = minSpeed.value + 1;
                    }

                    let maxSpeed = new SpeedsPerformance(driversData[i].lastName.slice(0, 3).toUpperCase(), fastestLapsData[i].maxSpeed, driversData[i].teamColour);
                    maxDriversSpeeds.push(maxSpeed);
                    if (maxSpeed.value - 1 < maxDriversSpeedBounds.minY) {
                        maxDriversSpeedBounds.minY = maxSpeed.value - 1;
                    }
                    if (maxSpeed.value + 1 > maxDriversSpeedBounds.maxY) {
                        maxDriversSpeedBounds.maxY = maxSpeed.value + 1;
                    }

                    let throttle = new SpeedsPerformance(driversData[i].lastName.slice(0, 3).toUpperCase(), fastestLapsData[i].throttle * 100, driversData[i].teamColour);
                    throttleDrivers.push(throttle);
                    if (throttle.value - 1 < throttleDriversBounds.minY) {
                        throttleDriversBounds.minY = throttle.value - 1;
                    }
                    if (throttle.value + 1 > throttleDriversBounds.maxY) {
                        throttleDriversBounds.maxY = throttle.value + 1;
                    }
                }

                let minTeamsSpeeds = [];
                let minTeamsSpeedBounds = new Bounds(999, 0);
                let maxTeamsSpeeds = [];
                let maxTeamsSpeedBounds = new Bounds(999, 0);
                let throttleTeams = [];
                let throttleTeamsBounds = new Bounds(999, 0);

                for (let i = 0; i < fastestLapsTeams.length; i++) {
                    let minSpeed = new SpeedsPerformance(teamsData[i].teamName, fastestLapsTeams[i].minSpeed, teamsData[i].teamColour);
                    minTeamsSpeeds.push(minSpeed);
                    if (minSpeed.value - 1 < minTeamsSpeedBounds.minY) {
                        minTeamsSpeedBounds.minY = minSpeed.value - 1;
                    }
                    if (minSpeed.value + 1 > minTeamsSpeedBounds.maxY) {
                        minTeamsSpeedBounds.maxY = minSpeed.value + 1;
                    }

                    let maxSpeed = new SpeedsPerformance(teamsData[i].teamName, fastestLapsTeams[i].maxSpeed, teamsData[i].teamColour);
                    maxTeamsSpeeds.push(maxSpeed);
                    if (maxSpeed.value - 1 < maxTeamsSpeedBounds.minY) {
                        maxTeamsSpeedBounds.minY = maxSpeed.value - 1;
                    }
                    if (maxSpeed.value + 1 > maxTeamsSpeedBounds.maxY) {
                        maxTeamsSpeedBounds.maxY = maxSpeed.value + 1;
                    }

                    let throttle = new SpeedsPerformance(teamsData[i].teamName, fastestLapsTeams[i].throttle * 100, teamsData[i].teamColour);
                    throttleTeams.push(throttle);
                    if (throttle.value - 1 < throttleTeamsBounds.minY) {
                        throttleTeamsBounds.minY = throttle.value - 1;
                    }
                    if (throttle.value + 1 > throttleTeamsBounds.maxY) {
                        throttleTeamsBounds.maxY = throttle.value + 1;
                    }
                }

                minDriversSpeeds.sort((a, b) => b.value - a.value);
                minTeamsSpeeds.sort((a, b) => b.value - a.value);
                maxDriversSpeeds.sort((a, b) => b.value - a.value);
                maxTeamsSpeeds.sort((a, b) => b.value - a.value);
                throttleDrivers.sort((a, b) => b.value - a.value);
                throttleTeams.sort((a, b) => b.value - a.value);

                setMinSpeedDriverData(minDriversSpeeds);
                setMinSpeedDriverBounds(minDriversSpeedBounds);
                setMinSpeedTeamData(minTeamsSpeeds);
                setMinSpeedTeamBounds(minTeamsSpeedBounds);

                setMaxSpeedDriverData(maxDriversSpeeds);
                setMaxSpeedDriverBounds(maxDriversSpeedBounds);
                setMaxSpeedTeamData(maxTeamsSpeeds);
                setMaxSpeedTeamBounds(maxTeamsSpeedBounds);

                setThrottleDriverData(throttleDrivers);
                setThrottleDriverBounds(throttleDriversBounds);
                setThrottleTeamData(throttleTeams);
                setThrottleTeamBounds(throttleTeamsBounds);
                
                console.log(laps);
                console.log(drivers);
            } catch (error) {
                console.error("Error fetching pit performance data:", error);
            }
        };

        fetchSpeeds();
    }, []);

    return (
        <Box
            sx={{
                width: "100%",
                height: "100%",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                color: "#E3E3E3",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 2,
                    justifyContent: "center",
                    alignItems: "center",
                    mb: 2,
                }}
            >
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

                {/* Second ToggleButtonGroup */}
                <ToggleButtonGroup
                    value={chartType}
                    exclusive
                    onChange={handleChartChange}
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
                    <ToggleButton value="min">Min Speed</ToggleButton>
                    <ToggleButton value="max">Max Speed</ToggleButton>
                    <ToggleButton value="throttle">Throttle</ToggleButton>
                </ToggleButtonGroup>
            </Box>
            <ResponsiveContainer width="100%" height="100%">
                {
                    minSpeedDrivers.length == 0 ? (
                        <Stack
                            spacing={3}
                            alignItems="center"
                            justifyContent="center"
                            sx={{ minHeight: "80vh" }} // Full height minus Navbar for centering
                        >
                            <Box sx={{ width: '30%' }}>
                                <LinearProgress color="inherit" />
                            </Box>
                            <Typography variant="h6" fontWeight="500" sx={{ color: "#E3E3E3" }}>
                                Loading Data...
                            </Typography>
                        </Stack>
                    )
                        :
                        <BarChart
                            data={
                                dataType === "drivers" ? chartType === "min" ? minSpeedDrivers : chartType === "max" ? maxSpeedDrivers : throttleDrivers : chartType === "min" ? minSpeedTeams : chartType === "max" ? maxSpeedTeams : throttleTeams
                            }
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
                                    value: chartType == "min" ? "Min speed during fastest lap (kph)" : chartType == "max" ? "Max speed during fastest lap (kph)" : "Time with maximum throttle on (%)",
                                    angle: -90,
                                    position: "insideLeft",
                                    style: { fontFamily: exo2.style.fontFamily, fontWeight: "600" },
                                    fill: "#E2E2E2",
                                    dy: 70,
                                }}
                                domain={[
                                    Math.floor(
                                        (dataType === "drivers" ? chartType === "min" ? minSpeedDriverBounds : chartType === "max" ? maxSpeedDriverBounds : throttleDriverBounds : chartType === "min" ? minSpeedTeamBounds : chartType === "max" ? maxSpeedTeamBounds : throttleTeamBounds).minY
                                    ),
                                    Math.ceil(
                                        (dataType === "drivers" ? chartType === "min" ? minSpeedDriverBounds : chartType === "max" ? maxSpeedDriverBounds : throttleDriverBounds : chartType === "min" ? minSpeedTeamBounds : chartType === "max" ? maxSpeedTeamBounds : throttleTeamBounds).maxY
                                    ),
                                ]}
                                ticks={(() => {
                                    const bounds = dataType === "drivers" ? chartType === "min" ? minSpeedDriverBounds : chartType === "max" ? maxSpeedDriverBounds : throttleDriverBounds : chartType === "min" ? minSpeedTeamBounds : chartType === "max" ? maxSpeedTeamBounds : throttleTeamBounds;
                                    const min = Math.floor(bounds.minY);
                                    const max = Math.ceil(bounds.maxY);
                                    const tickArray = [];
                                    for (let i = min; i <= max; i++) {
                                        tickArray.push(i);
                                    }
                                    return tickArray;
                                })()}
                                interval={0}
                                tickFormatter={(value) => value.toFixed(0)}
                            />
                            <Bar dataKey="value" radius={[14, 14, 0, 0]}>
                                {(dataType === "drivers" ? chartType === "min" ? minSpeedDrivers : chartType === "max" ? maxSpeedDrivers : throttleDrivers : chartType === "min" ? minSpeedTeams : chartType === "max" ? maxSpeedTeams : throttleTeams).map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                                <LabelList
                                    dataKey="value"
                                    position="top"
                                    formatter={(value: number) => chartType == "throttle" ? value.toFixed(1) + "%" : value.toFixed(0)}
                                    fontFamily={exo2Regular.style.fontFamily}
                                    fontWeight="600"
                                    fontSize={24}
                                />
                            </Bar>
                        </BarChart>
                }
            </ResponsiveContainer>
        </Box>
    );
};

export default SpeedsChart;
