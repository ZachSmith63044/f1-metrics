"use client";

import { LiveDriver, LiveLapData } from "@/app/utils/fetchLiveData";
import { Box, Tab, Tabs } from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import { LiveStrategy } from "./LiveStrategy";
import ChooseLaps from "./ChooseLapsLive";
import { fetchLiveTelemetryData } from "@/app/utils/fetchTelemetryData";
import { TelemetryFrame } from "@/app/classes/telemetryData";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface LiveTelemetryProps {
    lapsData: Record<number, LiveLapData[]>;
    positions: number[];
    drivers: Record<number, LiveDriver>;
}

interface TelemetryFrameMeta {
    metadata: LiveDriver,
    telemetryFrame: TelemetryFrame
}

interface DriverLineData {
    driver: LiveDriver;
    lap: LiveLapData;
    telemetry: TelemetryFrame[];
    isDashed: boolean;
};


const sections = ["Strategy View", "Lap Times", "Telemetry Comparison"];

export const LiveTelemetry: React.FC<LiveTelemetryProps> = ({
    lapsData,
    positions,
    drivers
}) => {

    const [telemetryData, setTelemetryData] = useState<DriverLineData[]>([]);

    const [minDelta, setMinDelta] = useState<number>(0);
    const [maxDelta, setMaxDelta] = useState<number>(0.1);
    const [minSpeed, setMinSpeed] = useState<number>(0);
    const [maxSpeed, setMaxSpeed] = useState<number>(10);

    const [section, setSection] = useState('Strategy View');

    const handleSectionChange = (event: React.SyntheticEvent, newValue: string) => {
        setSection(newValue);
    };

    useEffect(() => {
        console.log(lapsData);
        console.log("LIVE LAPS");
    }, [lapsData]);

    useEffect(() => {
        console.log(positions);
        console.log("positions");
    }, [positions]);

    const getLiveTelem = async (driverNum: number, lapNumber: number, lapTime: number) => {
        let telem = await fetchLiveTelemetryData(driverNum.toString(), lapNumber, lapTime);
        return telem;
    };

    const calculateDeltas = (laps: DriverLineData[]) => {
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

            let comparitorFrames = cLapsData[ind].telemetry;

            for (let i = 0; i < cLapsData.length; i++) {
                let comparisonFrames = cLapsData[i].telemetry;
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

                        cLapsData[i].telemetry[j].deltaTime = delta;
                    }
                    else {
                        let currentDist = comparisonFrames[j].relativeDistance;
                        let dist1 = comparitorFrames[currentIndex].relativeDistance;
                        let dist2 = comparitorFrames[currentIndex + 1].relativeDistance;

                        let proportion = (currentDist - dist1) / (dist2 - dist1);

                        let otherTime = proportion * comparitorFrames[currentIndex + 1].time + (1 - proportion) * comparitorFrames[currentIndex].time;

                        let delta = comparisonFrames[j].time - otherTime;

                        cLapsData[i].telemetry[j].deltaTime = delta;
                    }
                }
            }

            let minDelta: number = 0.1;
            let maxDelta: number = -0.1;

            let minSpeed = 300;
            let maxSpeed = 0;

            for (let i = 0; i < cLapsData.length; i++) {
                for (let j = 0; j < cLapsData[i].telemetry.length; j++) {
                    if (minDelta > cLapsData[i].telemetry[j].deltaTime) {
                        minDelta = cLapsData[i].telemetry[j].deltaTime;
                    }
                    if (maxDelta < cLapsData[i].telemetry[j].deltaTime) {
                        maxDelta = cLapsData[i].telemetry[j].deltaTime;
                    }


                    if (minSpeed > cLapsData[i].telemetry[j].speed) {
                        minSpeed = cLapsData[i].telemetry[j].speed;
                    }
                    if (maxSpeed < cLapsData[i].telemetry[j].speed) {
                        maxSpeed = cLapsData[i].telemetry[j].speed;
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

            setTelemetryData(cLapsData);
        }

        else {
            console.log("NO DELTAS");
        }
    };


    const CustomTooltip = ({ active, payload, label, type, }: { active?: boolean; payload?: any[]; label?: number; type: string; }) => {
        if (active && payload && payload.length && label) {
            let frames: TelemetryFrameMeta[] = [];
            for (let i = 0; i < telemetryData.length; i++) {
                for (let j = 0; j < telemetryData[i].telemetry.length; j++) {
                    if (telemetryData[i].telemetry[j].relativeDistance > label) {
                        if (j > 0) {
                            if (label - telemetryData[i].telemetry[j - 1].relativeDistance < telemetryData[i].telemetry[j].relativeDistance - label) {
                                frames.push({ metadata: telemetryData[i].driver, telemetryFrame: telemetryData[i].telemetry[j - 1] });
                            }
                            else {
                                frames.push({ metadata: telemetryData[i].driver, telemetryFrame: telemetryData[i].telemetry[j] });
                            }
                        }
                        else {
                            frames.push({ metadata: telemetryData[i].driver, telemetryFrame: telemetryData[i].telemetry[j] });
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
                                        {entry.metadata.driver}
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
                                        {entry.metadata.driver}
                                    </p>
                                    <p style={{ margin: "2px 0", color: entry.telemetryFrame.drs == 1 ? "#00FF00" : entry.telemetryFrame.brake ? "#FF0000" : "#EAEAEA", fontWeight: "bold" }}>Speed: {entry.telemetryFrame.speed} ({entry.telemetryFrame.deltaTime < 0 ? "" : "+"}{entry.telemetryFrame.deltaTime.toFixed(3)})</p>

                                </div>
                            );
                        }
                        else if (type == "throttle") {
                            return (
                                <div key={index} style={{ marginBottom: "5px" }}>
                                    <p style={{ fontWeight: "bold", color: `${entry.metadata.teamColour}`, margin: 0 }}>
                                        {entry.metadata.driver} ({entry.telemetryFrame.throttle}%)
                                    </p>
                                </div>
                            );
                        }
                        else if (type == "brake") {
                            return (
                                <div key={index} style={{ marginBottom: "5px" }}>
                                    <p style={{ fontWeight: "bold", color: `${entry.metadata.teamColour}`, margin: 0 }}>
                                        {entry.metadata.driver} ({entry.telemetryFrame.brake == 1 ? "ON" : "OFF"})
                                    </p>
                                </div>
                            );
                        }
                        else if (type == "gear") {
                            return (
                                <div key={index} style={{ marginBottom: "5px" }}>
                                    <p style={{ fontWeight: "bold", color: `${entry.metadata.teamColour}`, margin: 0 }}>
                                        {entry.metadata.driver} ({entry.telemetryFrame.gear})
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
        <Box height="100vh">
            {
                telemetryData.length > 0 &&
                <ResponsiveContainer width="100%" height="65%">
                    <LineChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} tickCount={11} height={30} tickFormatter={(val, ind) => { return `${val * 100}%` }} />
                        <YAxis domain={[minSpeed, maxSpeed]} tick={{ fill: 'white' }} width={55} label={{ value: "Speed (km/h)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle" } }} />
                        <Tooltip content={(props) => <CustomTooltip {...props} type="speed" />} />
                        {telemetryData.map((lapData, index) => (
                            <Line
                                key={index}
                                name={telemetryData[index].driver.driver}
                                type="linear"
                                data={lapData.telemetry}
                                dataKey="speed"
                                stroke={telemetryData[index].driver.teamColour}
                                strokeWidth={2}
                                dot={false}
                                activeDot={false}
                                strokeDasharray={telemetryData[index].isDashed ? "5,5" : ""}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            }
            {
                telemetryData.length > 0 &&
                <Box>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} tickCount={11} height={30} tickFormatter={(val, ind) => { return `${val * 100}%` }} />
                            <YAxis domain={[minDelta, maxDelta]} tick={{ fill: 'white' }} width={55} label={{ value: "Delta to fastest (s)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle" } }} />
                            <Tooltip content={(props) => <CustomTooltip {...props} type="deltaTime" />} />
                            {telemetryData.map((lapData, index) => (
                                <Line
                                    key={index}
                                    name={telemetryData[index].driver.driver}
                                    type="linear"
                                    data={lapData.telemetry}
                                    dataKey="deltaTime"
                                    stroke={telemetryData[index].driver.teamColour}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={false}
                                    strokeDasharray={telemetryData[index].isDashed ? "5,5" : ""}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                    <ResponsiveContainer width="100%" height={160}>
                        <LineChart>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} tickCount={11} height={30} tickFormatter={(val, ind) => { return `${val * 100}%` }} />
                            <YAxis domain={[-1, 101]} tick={false} axisLine={true} width={55} label={{ value: "Throttle (%)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle" } }} />
                            <Tooltip content={(props) => <CustomTooltip {...props} type="throttle" />} />
                            {telemetryData.map((lapData, index) => (
                                <Line
                                    key={index}
                                    name={telemetryData[index].driver.driver}
                                    type="linear"
                                    data={lapData.telemetry}
                                    dataKey="throttle"
                                    stroke={telemetryData[index].driver.teamColour}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={false}
                                    strokeDasharray={telemetryData[index].isDashed ? "5,5" : ""}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                    <ResponsiveContainer width="100%" height={120}>
                        <LineChart>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} height={0} tickCount={11} />
                            <YAxis domain={[-0.1, 1.1]} tick={false} axisLine={true} width={55} label={{ value: "Brake (on/off)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle" } }} />
                            <Tooltip content={(props) => <CustomTooltip {...props} type="brake" />} />
                            {telemetryData.map((lapData, index) => (
                                <Line
                                    key={index}
                                    name={telemetryData[index].driver.driver}
                                    type="linear"
                                    data={lapData.telemetry}
                                    dataKey="brake"
                                    stroke={telemetryData[index].driver.teamColour}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={false}
                                    strokeDasharray={telemetryData[index].isDashed ? "5,5" : ""}
                                />
                            ))}

                        </LineChart>
                    </ResponsiveContainer>
                    <ResponsiveContainer width="100%" height={120}>
                        <LineChart>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} height={0} tickCount={11} />
                            <YAxis domain={[0, 9]} tick={{ fill: 'white' }} tickCount={10} width={55} label={{ value: "Gear (1-8)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle" } }} />
                            <Tooltip content={(props) => <CustomTooltip {...props} type="gear" />} />
                            {telemetryData.map((lapData, index) => (
                                <Line
                                    key={index}
                                    name={telemetryData[index].driver.driver}
                                    type="linear"
                                    data={lapData.telemetry}
                                    dataKey="gear"
                                    stroke={telemetryData[index].driver.teamColour}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={false}
                                    strokeDasharray={telemetryData[index].isDashed ? "5,5" : ""}
                                />
                            ))}

                        </LineChart>
                    </ResponsiveContainer>
                </Box>
            }
            <ChooseLaps laps={lapsData} drivers={drivers} positions={positions} isCheckbox={false}
                onChoose={async (lap, driver) => {
                    console.log(lap); console.log(driver);
                    if (lap && driver) {
                        if (lap.isLoaded) {
                            let telem = await getLiveTelem(driver!.driverNumber, lap!.lapNumber, lap!.lapTime);
                            console.log(telem);
                            let telemTotal = [...telemetryData];
                            telemTotal.push({ telemetry: telem, driver: driver, isDashed: telemTotal.map((x) => x.driver.teamColour).includes(driver.teamColour), lap: lap });
                            calculateDeltas(telemTotal);
                        }
                    }
                }} />
        </Box>
    );
};