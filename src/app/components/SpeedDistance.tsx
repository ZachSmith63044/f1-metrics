"use client";

import React, { useState, useEffect } from "react";
import { Box, Typography, ThemeProvider, CssBaseline, ToggleButtonGroup, ToggleButton, Stack, LinearProgress } from "@mui/material";
import { LapData } from "../classes/lapData";
import { DriverData } from "../classes/driverData";
import ChooseLaps from "./ChooseLap";
import { fetchTelemetryData } from "../utils/fetchTelemetryData";
import { TelemetryFrame } from "../classes/telemetryData";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type SpeedDistanceProps = {
    laps: LapData[][];
    drivers: DriverData[];
    year: string;
    round: string;
    session: string;
};

interface DriverDataLegend {
    driverName: string;
    teamColour: string;
    isDashed: boolean;
}

interface AllDataLap {
    lap: LapData;
    legend: DriverDataLegend;
    driver: DriverData;
    frames: TelemetryFrame[];
}

interface TelemetryFrameMeta {
    metadata: DriverData,
    telemetryFrame: TelemetryFrame
}


const SpeedDistance: React.FC<SpeedDistanceProps> = ({ laps, drivers, year, round, session }) => {

    const [loadedLaps, setLoadedLaps] = useState<AllDataLap[]>([]);

    const loadLap = async (lap: LapData, driver: DriverData) => {
        let frames: TelemetryFrame[] = await fetchTelemetryData(year, round, session, driver.firstName + " " + driver.lastName, lap.lapNumber, lap.lapTime);

        let newLaps = [...loadedLaps];
        newLaps.push({ lap: lap, legend: { driverName: driver.firstName + " " + driver.lastName, teamColour: driver.teamColour, isDashed: loadedLaps.map((lap) => lap.legend.teamColour).includes(driver.teamColour) }, driver: driver, frames: frames });
        setLoadedLaps(newLaps);
        console.log(newLaps);
    }



    const CustomTooltip = ({ active, payload, label, type, }: { active?: boolean; payload?: any[]; label?: number; type: string; }) => {
        if (active && payload && payload.length && label) {
            let frames: TelemetryFrameMeta[] = [];
            for (let i = 0; i < loadedLaps.length; i++) {
                for (let j = 0; j < loadedLaps[i].frames.length; j++) {
                    if (loadedLaps[i].frames[j].relativeDistance > label) {
                        if (j > 0) {
                            if (label - loadedLaps[i].frames[j - 1].relativeDistance < loadedLaps[i].frames[j].relativeDistance - label) {
                                frames.push({ metadata: loadedLaps[i].driver, telemetryFrame: loadedLaps[i].frames[j - 1] });
                            }
                            else {
                                frames.push({ metadata: loadedLaps[i].driver, telemetryFrame: loadedLaps[i].frames[j] });
                            }
                        }
                        else {
                            frames.push({ metadata: loadedLaps[i].driver, telemetryFrame: loadedLaps[i].frames[j] });
                        }
                        break;
                    }
                }
            }
            return (
                <div style={{
                    background: "#333", // Dark grey background
                    color: "#fff", // White text for contrast
                    padding: "10px",
                    border: "1px solid #555",
                    borderRadius: "5px",
                    boxShadow: "0px 0px 5px rgba(0,0,0,0.4)"
                }}>
                    <p style={{ fontWeight: "bold", marginBottom: "5px" }}>Distance {(label * 100).toFixed(1)}%</p> {/* Shows hovered lap number */}
                    {frames.map((entry, index) => {
                        if (type == "speed") {
                            return (
                                <div key={index} style={{ marginBottom: "5px" }}>
                                    <p style={{ fontWeight: "bold", color: `${entry.metadata.teamColour}`, margin: 0 }}>
                                        {entry.metadata.lastName}
                                    </p>
                                    <p style={{ margin: "2px 0", color: entry.telemetryFrame.drs == 1 ? "#00FF00" : "#EAEAEA", fontWeight: entry.telemetryFrame.drs == 1 ? "bold" : "regular" }}>Speed: {entry.telemetryFrame.speed} ({entry.telemetryFrame.deltaTime < 0 ? "" : "+"}{entry.telemetryFrame.deltaTime.toFixed(3)})</p>
                                    <p style={{ margin: "2px 0" }}>Throttle: {entry.telemetryFrame.throttle}%</p>
                                    <p style={{ margin: "2px 0", fontWeight: "bold", color: entry.telemetryFrame.brake == 1 ? "#FF1111" : "#AAAAAA" }}>
                                        Brake
                                        <span style={{ color: "#EAEAEA", fontWeight: "normal", marginLeft: "40px" }}>
                                            Gear: {entry.telemetryFrame.gear}
                                        </span>
                                    </p>

                                </div>
                            );
                        }
                        else if (type == "deltaTime") {
                            return (
                                <div key={index} style={{ marginBottom: "5px" }}>
                                    <p style={{ fontWeight: "bold", color: `${entry.metadata.teamColour}`, margin: 0 }}>
                                        {entry.metadata.lastName} ({entry.telemetryFrame.deltaTime < 0 ? "" : "+"}{entry.telemetryFrame.deltaTime.toFixed(3)})
                                    </p>
                                </div>
                            );
                        }
                        else if (type == "throttle") {
                            return (
                                <div key={index} style={{ marginBottom: "5px" }}>
                                    <p style={{ fontWeight: "bold", color: `${entry.metadata.teamColour}`, margin: 0 }}>
                                        {entry.metadata.lastName} ({entry.telemetryFrame.throttle}%)
                                    </p>
                                </div>
                            );
                        }
                        else if (type == "brake") {
                            return (
                                <div key={index} style={{ marginBottom: "5px" }}>
                                    <p style={{ fontWeight: "bold", color: `${entry.metadata.teamColour}`, margin: 0 }}>
                                        {entry.metadata.lastName} ({entry.telemetryFrame.brake == 1 ? "ON" : "OFF"})
                                    </p>
                                </div>
                            );
                        }
                        else if (type == "gear") {
                            return (
                                <div key={index} style={{ marginBottom: "5px" }}>
                                    <p style={{ fontWeight: "bold", color: `${entry.metadata.teamColour}`, margin: 0 }}>
                                        {entry.metadata.lastName} ({entry.telemetryFrame.gear})
                                    </p>
                                </div>
                            );
                        }
                    })}
                </div>
            );
        }
        return null;
    };


    return (
        <Box>
            {
                loadedLaps.length == 0 ?
                    <Typography>
                        Pick a lap to load - you can click the title columns to sort
                    </Typography>
                    :
                    <Box sx={{ p: 2, }} height={"calc(100vh * 2)"}>
                        <ResponsiveContainer width="100%" height="35%">
                            <LineChart>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} tickCount={11} height={30} tickFormatter={(val, ind) => { return `${val * 100}%` }} />
                                <YAxis domain={[0, 380]} tick={{ fill: 'white' }} width={55} label={{ value: "Speed (km/h)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle" } }} />
                                <Tooltip content={(props) => <CustomTooltip {...props} type="speed" />} />
                                {loadedLaps.map((lapData, index) => (
                                    <Line
                                        key={index}
                                        name={loadedLaps[index].driver.lastName}
                                        type="linear"
                                        data={lapData.frames}
                                        dataKey="speed"
                                        stroke={loadedLaps[index].legend.teamColour}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={false}
                                        strokeDasharray={loadedLaps[index].legend.isDashed ? "5,5" : ""}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} tickCount={11} height={30} tickFormatter={(val, ind) => { return `${val * 100}%` }} />
                                <YAxis domain={[0, 380]} tick={{ fill: 'white' }} width={55} label={{ value: "Speed (km/h)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle" } }} />
                                <Tooltip content={(props) => <CustomTooltip {...props} type="speed" />} />
                                {loadedLaps.map((lapData, index) => (
                                    <Line
                                        key={index}
                                        name={loadedLaps[index].driver.lastName}
                                        type="linear"
                                        data={lapData.frames}
                                        dataKey="speed"
                                        stroke={loadedLaps[index].legend.teamColour}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={false}
                                        strokeDasharray={loadedLaps[index].legend.isDashed ? "5,5" : ""}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
            }
            <ChooseLaps laps={laps} driversData={drivers} onChoose={(lap, driver) => { loadLap(lap!, driver!) }} isCheckbox={false} />
        </Box>
    );
};

export default SpeedDistance;
