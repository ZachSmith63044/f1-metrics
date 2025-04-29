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

    const [minDelta, setMinDelta] = useState<number>(0);
    const [maxDelta, setMaxDelta] = useState<number>(0.1);
    const [minSpeed, setMinSpeed] = useState<number>(0);
    const [maxSpeed, setMaxSpeed] = useState<number>(10);

    const loadLap = async (lap: LapData, driver: DriverData) => {
        let frames: TelemetryFrame[] = await fetchTelemetryData(year, round, session, driver.firstName + " " + driver.lastName, lap.lapNumber, lap.lapTime);

        let newLaps = [...loadedLaps];
        newLaps.push({ lap: lap, legend: { driverName: driver.firstName + " " + driver.lastName, teamColour: driver.teamColour, isDashed: loadedLaps.map((lap) => lap.legend.teamColour).includes(driver.teamColour) }, driver: driver, frames: frames });
        calculateDeltas(newLaps);
    }


    const calculateDeltas = (laps: AllDataLap[]) => {
        if (laps.length > 0) {
            let cLapsData = [...laps]
            let minLap = 999;
            let ind = 0;
            for (let i = 0; i < laps.length; i++) {
                if (laps[i].lap.lapTime < minLap) {
                    minLap = laps[i].lap.lapTime;
                    ind = i;
                }
            }

            let comparitorFrames = cLapsData[ind].frames;

            for (let i = 0; i < cLapsData.length; i++) {
                let comparisonFrames = cLapsData[i].frames;
                let currentIndex = 0;
                for (let j = 0; j < comparisonFrames.length; j++) {
                    for (let k = currentIndex; k < comparitorFrames.length; k++) {
                        if (comparitorFrames[k].relativeDistance > comparisonFrames[j].relativeDistance) {
                            break;
                        }
                        else {
                            currentIndex = k + 0;
                        }
                    }
                    if (currentIndex == comparitorFrames.length - 1) {
                        let delta = cLapsData[i].lap.lapTime - cLapsData[ind].lap.lapTime;

                        cLapsData[i].frames[j].deltaTime = delta;
                    }
                    else {
                        let currentDist = comparisonFrames[j].relativeDistance;
                        let dist1 = comparitorFrames[currentIndex].relativeDistance;
                        let dist2 = comparitorFrames[currentIndex + 1].relativeDistance;

                        let proportion = (currentDist - dist1) / (dist2 - dist1);

                        let otherTime = proportion * comparitorFrames[currentIndex + 1].time + (1 - proportion) * comparitorFrames[currentIndex].time;

                        let delta = comparisonFrames[j].time - otherTime;

                        cLapsData[i].frames[j].deltaTime = delta;
                    }
                }
            }

            let minDelta: number = 0.1;
            let maxDelta: number = -0.1;

            let minSpeed = 300;
            let maxSpeed = 0;

            for (let i = 0; i < cLapsData.length; i++) {
                for (let j = 0; j < cLapsData[i].frames.length; j++) {
                    if (minDelta > cLapsData[i].frames[j].deltaTime) {
                        minDelta = cLapsData[i].frames[j].deltaTime;
                    }
                    if (maxDelta < cLapsData[i].frames[j].deltaTime) {
                        maxDelta = cLapsData[i].frames[j].deltaTime;
                    }


                    if (minSpeed > cLapsData[i].frames[j].speed) {
                        minSpeed = cLapsData[i].frames[j].speed;
                    }
                    if (maxSpeed < cLapsData[i].frames[j].speed) {
                        maxSpeed = cLapsData[i].frames[j].speed;
                    }
                }
            }


            minSpeed = Math.floor((minSpeed - 1) / 10) * 10;
            maxSpeed = Math.ceil((maxSpeed + 1) / 10) * 10;

            minDelta = Math.floor(minDelta * 10) / 10;
            maxDelta = Math.ceil(maxDelta * 10) / 10;

            setMinSpeed(minSpeed);
            setMaxSpeed(maxSpeed);

            setMinDelta(minDelta);
            setMaxDelta(maxDelta);

            setLoadedLaps(cLapsData);
        }

        else {
            console.log("NO DELTAS");
        }
    };




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
                    background: "#333",
                    color: "#fff",
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
                                        {entry.metadata.lastName}
                                    </p>
                                    <p style={{ margin: "2px 0", color: entry.telemetryFrame.drs == 1 ? "#00FF00" : entry.telemetryFrame.brake ? "#FF0000" : "#EAEAEA", fontWeight: "bold" }}>Speed: {entry.telemetryFrame.speed} ({entry.telemetryFrame.deltaTime < 0 ? "" : "+"}{entry.telemetryFrame.deltaTime.toFixed(3)})</p>

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
            <Box sx={{}} height={"calc(100vh)"} gap={2}>
                {
                    loadedLaps.length == 0 ?
                        <Typography>
                            Pick a lap to load - you can click the title columns to sort
                        </Typography>
                        :
                        <ResponsiveContainer width="100%" height="65%">
                            <LineChart>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} tickCount={11} height={30} tickFormatter={(val, ind) => { return `${val * 100}%` }} />
                                <YAxis domain={[minSpeed, maxSpeed]} tick={{ fill: 'white' }} width={55} label={{ value: "Speed (km/h)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle" } }} />
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
                }
                {
                    loadedLaps.length > 0 && <ResponsiveContainer width="100%" height={280}>
                        <LineChart>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} tickCount={11} height={30} tickFormatter={(val, ind) => { return `${val * 100}%` }} />
                            <YAxis domain={[minDelta, maxDelta]} tick={{ fill: 'white' }} width={55} label={{ value: "Delta to fastest (s)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle" } }} />
                            <Tooltip content={(props) => <CustomTooltip {...props} type="deltaTime" />} />
                            {loadedLaps.map((lapData, index) => (
                                <Line
                                    key={index}
                                    name={loadedLaps[index].driver.lastName}
                                    type="linear"
                                    data={lapData.frames}
                                    dataKey="deltaTime"
                                    stroke={loadedLaps[index].legend.teamColour}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={false}
                                    strokeDasharray={loadedLaps[index].legend.isDashed ? "5,5" : ""}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                }
                {
                    loadedLaps.length > 0 && <ResponsiveContainer width="100%" height={120}>
                        <LineChart>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} height={0} tickCount={11} />
                            <YAxis domain={[-1, 101]} tick={false} axisLine={true} width={55} label={{ value: "Throttle (%)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle" } }} />
                            <Tooltip content={(props) => <CustomTooltip {...props} type="throttle" />} />
                            {loadedLaps.map((lapData, index) => (
                                <Line
                                    key={index}
                                    name={loadedLaps[index].driver.lastName}
                                    type="linear"
                                    data={lapData.frames}
                                    dataKey="throttle"
                                    stroke={loadedLaps[index].legend.teamColour}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={false}
                                    strokeDasharray={loadedLaps[index].legend.isDashed ? "5,5" : ""}
                                />
                            ))}

                        </LineChart>
                    </ResponsiveContainer>
                }
                {
                    loadedLaps.length > 0 && <ResponsiveContainer width="100%" height={120}>
                        <LineChart>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} height={0} tickCount={11} />
                            <YAxis domain={[-0.1, 1.1]} tick={false} axisLine={true} width={55} label={{ value: "Brake (on/off)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle" } }} />
                            <Tooltip content={(props) => <CustomTooltip {...props} type="brake" />} />
                            {loadedLaps.map((lapData, index) => (
                                <Line
                                    key={index}
                                    name={loadedLaps[index].driver.lastName}
                                    type="linear"
                                    data={lapData.frames}
                                    dataKey="brake"
                                    stroke={loadedLaps[index].legend.teamColour}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={false}
                                    strokeDasharray={loadedLaps[index].legend.isDashed ? "5,5" : ""}
                                />
                            ))}

                        </LineChart>
                    </ResponsiveContainer>
                }
                {
                    loadedLaps.length > 0 && <ResponsiveContainer width="100%" height={120}>
                        <LineChart>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} height={0} tickCount={11} />
                            <YAxis domain={[0, 9]} tick={{ fill: 'white' }} tickCount={10} width={55} label={{ value: "Gear (1-8)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle" } }} />
                            <Tooltip content={(props) => <CustomTooltip {...props} type="gear" />} />
                            {loadedLaps.map((lapData, index) => (
                                <Line
                                    key={index}
                                    name={loadedLaps[index].driver.lastName}
                                    type="linear"
                                    data={lapData.frames}
                                    dataKey="gear"
                                    stroke={loadedLaps[index].legend.teamColour}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={false}
                                    strokeDasharray={loadedLaps[index].legend.isDashed ? "5,5" : ""}
                                />
                            ))}

                        </LineChart>
                    </ResponsiveContainer>
                }
                <ChooseLaps
                    laps={laps}
                    driversData={drivers} 
                    onChoose={(lap, driver) => {
                        if (lap?.isLoaded)
                        {
                            loadLap(lap!, driver!);
                        }
                        else
                        {
                            let laps = [...loadedLaps];
                            for (let i = 0; i < loadedLaps.length; i++)
                            {
                                if (loadedLaps[i].driver.firstName + loadedLaps[i].driver.lastName == driver!.firstName + driver!.lastName)
                                {
                                    laps.splice(i, 1);
                                    break;
                                }
                            }
                            setLoadedLaps(laps);
                        }

                    }}
                    isCheckbox={false} />
            </Box>
        </Box>
    );
};

export default SpeedDistance;
