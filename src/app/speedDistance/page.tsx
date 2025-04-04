"use client";

import React, { useState, useEffect } from "react";
import { Box, ThemeProvider, CssBaseline } from "@mui/material";
import darkTheme from "../theme";
import Navbar from "../components/Navbar";
import { fetchTelemetryData } from "../utils/fetchTelemetryData";
import { fetchDriverData } from "../utils/fetchDriverData";
import { LapMetadata, TelemetryFrame } from "../classes/telemetryData";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

interface FullLapData {
    lapMetadata: LapMetadata;
    lap: TelemetryFrame[];
}

interface TelemetryFrameMeta {
    metadata: LapMetadata,
    telemetryFrame: TelemetryFrame
}

const SpeedDistance = () => {
    const [lapsMetadata, setLapsMetadata] = useState<LapMetadata[]>([]);
    const [lapsData, setLapsData] = useState<TelemetryFrame[][]>([]);

    const [minDelta, setMinDelta] = useState<number>(0);
    const [maxDelta, setMaxDelta] = useState<number>(0.1);
    const [minSpeed, setMinSpeed] = useState<number>(0);
    const [maxSpeed, setMaxSpeed] = useState<number>(10);

    const calculateDeltas = (lapsMetadata: LapMetadata[], lapsData: TelemetryFrame[][]) => {
        if (lapsData.length > 0)
        {
            let cLapsData = [...lapsData]
            let minLap = 999;
            let ind = 0;
            for (let i = 0; i < lapsMetadata.length; i++)
            {
                if (lapsMetadata[i].lapTime < minLap)
                {
                    minLap = lapsMetadata[i].lapTime;
                    ind = i;
                }
            }

            let comparitorFrames = cLapsData[ind];

            for (let i = 0; i < cLapsData.length; i++)
            {
                let comparisonFrames = cLapsData[i];
                let currentIndex = 0;
                for (let j = 0; j < comparisonFrames.length; j++)
                {
                    for (let k = currentIndex; k < comparitorFrames.length; k++)
                    {
                        if (comparitorFrames[k].relativeDistance > comparisonFrames[j].relativeDistance)
                        {
                            break;
                        }
                        else
                        {
                            currentIndex = k + 0;
                        }
                    }
                    if (currentIndex == comparitorFrames.length - 1)
                    {
                        let delta = lapsMetadata[i].lapTime - lapsMetadata[ind].lapTime;

                        cLapsData[i][j].deltaTime = delta;
                    }
                    else
                    {
                        let currentDist = comparisonFrames[j].relativeDistance;
                        let dist1 = comparitorFrames[currentIndex].relativeDistance;
                        let dist2 = comparitorFrames[currentIndex + 1].relativeDistance;

                        let proportion = (currentDist - dist1)/(dist2 - dist1);

                        let otherTime = proportion * comparitorFrames[currentIndex + 1].time + (1 - proportion) * comparitorFrames[currentIndex].time;

                        let delta = comparisonFrames[j].time - otherTime;

                        cLapsData[i][j].deltaTime = delta;
                    }
                }
            }

            let minDelta: number = 0.1;
            let maxDelta: number = -0.1;

            let minSpeed = 300;
            let maxSpeed = 0;

            for (let i = 0; i < cLapsData.length; i++)
            {
                for (let j = 0; j < cLapsData[i].length; j++)
                {
                    if (minDelta > cLapsData[i][j].deltaTime)
                    {
                        minDelta = cLapsData[i][j].deltaTime;
                    }
                    if (maxDelta < cLapsData[i][j].deltaTime)
                    {
                        maxDelta = cLapsData[i][j].deltaTime;
                    }


                    if (minSpeed > cLapsData[i][j].speed)
                    {
                        minSpeed = cLapsData[i][j].speed;
                    }
                    if (maxSpeed < cLapsData[i][j].speed)
                    {
                        maxSpeed = cLapsData[i][j].speed;
                    }
                }
            }


            minSpeed = Math.floor((minSpeed - 1)/10) * 10;
            maxSpeed = Math.ceil((maxSpeed + 1)/10) * 10;
            
            minDelta = Math.floor(minDelta * 10)/10;
            maxDelta = Math.ceil(maxDelta * 10)/10;

            setMinSpeed(minSpeed);
            setMaxSpeed(maxSpeed);

            setMinDelta(minDelta);
            setMaxDelta(maxDelta);

            setLapsData(cLapsData);
            setLapsMetadata(lapsMetadata);
        }

        else
        {
            console.log("NO DELTAS");
        }
    };

    const fetchSpeeds = async (year: string, round: string, session: string, driver: string, lapNumber: number, lapTime: number, position: number): Promise<FullLapData> => {
        if (!lapsMetadata.map((lap) => `${lap.year}${lap.round}${lap.session}${lap.driver}${lap.lapNumber}`).includes(`${year}${round}${session}${driver}${lapNumber}`))
        {
            const startTime = performance.now();
            const [data, driverData] = await Promise.all([
                fetchTelemetryData(year, round, session, driver, lapNumber, lapTime),
                fetchDriverData(year, round, session, driver)
            ]);
            
            return { lapMetadata: new LapMetadata(year, round, session, driver, lapNumber, lapTime, position, driverData.teamColour), lap: data };
        }
        else
        {
            return { lapMetadata: new LapMetadata(year, round, session, driver, lapNumber, lapTime, position, "#FF0000"), lap: [] };
        }
    };

    const fetchLaps = async (data: any[][]) => {
        const lapPromises = data.map(lap => 
            fetchSpeeds(lap[0], lap[1], lap[2], lap[3], lap[4], lap[5], lap[6])
        );
    
        const results = await Promise.all(lapPromises);
    
        // setLapsMetadata(prev => [...prev, ...results.map(res => res.lapMetadata)]);
        // setLapsData(prev => [...prev, ...results.map(res => res.lap)]);

        let lapMeta = [...lapsMetadata, ...results.map(res => res.lapMetadata)];
        let lapData = [...lapsData, ...results.map(res => res.lap)];

        console.log(lapMeta);
        console.log(lapData);

        calculateDeltas(lapMeta, lapData);
    };

    useEffect(() => {
        fetchLaps([["2024", "22) Las Vegas Grand Prix", "Qualifying", "George Russell", 24, 92.312, 1], ["2024", "22) Las Vegas Grand Prix", "Qualifying", "Carlos Sainz", 23, 92.41, 2], ["2024", "22) Las Vegas Grand Prix", "Qualifying", "Pierre Gasly", 24, 92.664, 3]]);
    }, []);

    const CustomTooltip = ({active,payload,label,type,}: {active?: boolean;payload?: any[];label?: number;type: string;}) => {
        if (active && payload && payload.length && label) {
            let frames: TelemetryFrameMeta[] = [];
            for (let i = 0; i < lapsData.length; i++)
            {
                for (let j = 0; j < lapsData[i].length; j++)
                {       
                    if (lapsData[i][j].relativeDistance > label)
                    {
                        if (j > 0)
                        {
                            if (label - lapsData[i][j - 1].relativeDistance < lapsData[i][j].relativeDistance - label)
                            {
                                frames.push({ metadata: lapsMetadata[i], telemetryFrame: lapsData[i][j - 1] });
                            }
                            else
                            {
                                frames.push({ metadata: lapsMetadata[i], telemetryFrame: lapsData[i][j] });
                            }
                        }
                        else
                        {
                            frames.push({ metadata: lapsMetadata[i], telemetryFrame: lapsData[i][j] });
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
                        if (type == "speed")
                        {
                            return (
                                <div key={index} style={{ marginBottom: "5px" }}>
                                    <p style={{ fontWeight: "bold", color: `${entry.metadata.colour}`, margin: 0 }}>
                                        {entry.metadata.driver}
                                    </p>
                                    <p style={{ margin: "2px 0" }}>Speed: {entry.telemetryFrame.speed} ({entry.telemetryFrame.deltaTime < 0 ? "" : "+"}{entry.telemetryFrame.deltaTime.toFixed(3)})</p>
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
                        else if (type == "deltaTime")
                        {
                            return (
                                <div key={index} style={{ marginBottom: "5px" }}>
                                    <p style={{ fontWeight: "bold", color: `${entry.metadata.colour}`, margin: 0 }}>
                                        {entry.metadata.driver} ({entry.telemetryFrame.deltaTime < 0 ? "" : "+"}{entry.telemetryFrame.deltaTime.toFixed(3)})
                                    </p>
                                </div>
                            );
                        }
                        else if (type == "throttle")
                        {
                            return (
                                <div key={index} style={{ marginBottom: "5px" }}>
                                    <p style={{ fontWeight: "bold", color: `${entry.metadata.colour}`, margin: 0 }}>
                                        {entry.metadata.driver} ({entry.telemetryFrame.throttle}%)
                                    </p>
                                </div>
                            );
                        }
                        else if (type == "brake")
                        {
                            return (
                                <div key={index} style={{ marginBottom: "5px" }}>
                                    <p style={{ fontWeight: "bold", color: `${entry.metadata.colour}`, margin: 0 }}>
                                        {entry.metadata.driver} ({entry.telemetryFrame.brake == 1 ? "ON" : "OFF"})
                                    </p>
                                </div>
                            );
                        }
                        else if (type == "gear")
                        {
                            return (
                                <div key={index} style={{ marginBottom: "5px" }}>
                                    <p style={{ fontWeight: "bold", color: `${entry.metadata.colour}`, margin: 0 }}>
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
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Navbar />
            <Box sx={{ p: 2, height: "calc(100vh - 90px)" }}>
                {lapsData.length > 0 ? (
                    <Box width="100%" height="100%">
                        <ResponsiveContainer width="100%" height="75%">
                            <LineChart>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} tickCount={11} height={30} tickFormatter={(val, ind) => {return `${val * 100}%`}} />
                                <YAxis domain={[minSpeed, maxSpeed]} tick={{ fill: 'white' }} width={55} label={{ value: "Speed (km/h)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle"} }} />
                                <Tooltip content={(props) => <CustomTooltip {...props} type="speed" />} />
                                {lapsData.map((lapData, index) => (
                                    <Line
                                        key={index}
                                        name={lapsMetadata[index].driver}
                                        type="linear"
                                        data={lapData}
                                        dataKey="speed"
                                        stroke={lapsMetadata[index].colour}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={false}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} height={0} tickCount={11} />
                                <YAxis domain={[minDelta, maxDelta]} tick={{ fill: 'white' }} tickCount={(maxDelta - minDelta) * 10 + 1} width={55} label={{ value: "Delta to fastest (s)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle"} }} />
                                <Tooltip content={(props) => <CustomTooltip {...props} type="deltaTime" />} />
                                {lapsData.map((lapData, index) => (
                                    <Line
                                        key={index}
                                        name={lapsMetadata[index].driver}
                                        type="linear"
                                        data={lapData}
                                        dataKey="deltaTime"
                                        stroke={lapsMetadata[index].colour}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={false}
                                    />
                                ))}
                                
                            </LineChart>
                        </ResponsiveContainer>
                        <ResponsiveContainer width="100%" height={120}>
                            <LineChart>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} height={0} tickCount={11} />
                                <YAxis domain={[-1, 101]} tick={false} axisLine={true} width={55} label={{ value: "Throttle (%)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle"} }} />
                                <Tooltip content={(props) => <CustomTooltip {...props} type="throttle" />} />
                                {lapsData.map((lapData, index) => (
                                    <Line
                                        key={index}
                                        name={lapsMetadata[index].driver}
                                        type="linear"
                                        data={lapData}
                                        dataKey="throttle"
                                        stroke={lapsMetadata[index].colour}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={false}
                                    />
                                ))}
                                
                            </LineChart>
                        </ResponsiveContainer>
                        <ResponsiveContainer width="100%" height={120}>
                            <LineChart>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} height={0} tickCount={11} />
                                <YAxis domain={[-0.1, 1.1]} tick={false} axisLine={true} width={55} label={{ value: "Brake (on/off)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle"} }} />
                                <Tooltip content={(props) => <CustomTooltip {...props} type="brake" />} />
                                {lapsData.map((lapData, index) => (
                                    <Line
                                        key={index}
                                        name={lapsMetadata[index].driver}
                                        type="linear"
                                        data={lapData}
                                        dataKey="brake"
                                        stroke={lapsMetadata[index].colour}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={false}
                                    />
                                ))}
                                
                            </LineChart>
                        </ResponsiveContainer>
                        <ResponsiveContainer width="100%" height={120}>
                            <LineChart>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} height={0} tickCount={11} />
                                <YAxis domain={[0, 9]} tick={{ fill: 'white' }} tickCount={10} width={55} label={{ value: "Gear (1-8)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle"} }} />
                                <Tooltip content={(props) => <CustomTooltip {...props} type="gear" />} />
                                {lapsData.map((lapData, index) => (
                                    <Line
                                        key={index}
                                        name={lapsMetadata[index].driver}
                                        type="linear"
                                        data={lapData}
                                        dataKey="gear"
                                        stroke={lapsMetadata[index].colour}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={false}
                                    />
                                ))}
                                
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                ) : null}
            </Box>
        </ThemeProvider>
    );
};

export default SpeedDistance;
