"use client";


import React, { useEffect, useRef, useState } from "react";
import darkTheme from "../theme";
import { CssBaseline, ThemeProvider, Stack, Typography, Box } from "@mui/material";
import Navbar from "../components/Navbar";
import { getLiveData, getLiveDrivers, getLiveSession, getTrackMap, LiveData, LiveDriver, LivePosition, LiveSession, LiveTelemetry, Pos } from "../utils/fetchLiveData";
import { TrackMapDisplay } from "../components/TrackMapDisplay";

export interface LiveDriverData {
    driver: LiveDriver;
    telemetry: LiveTelemetry[];
    position: LivePosition[];
}

export default function LiveDash() {
    let date: Date = new Date("2025-04-13T15:05:40+00:00");
    const delayRef = useRef(0);
    const timeBefore = 1.25; // time before start to start download

    const [mapPoints, setMapPoints] = useState<Pos[]>([]);
    const [sessionData, setSession] = useState<LiveSession>(new LiveSession("", "", 0));
    const [telemetryData, setTelemetryData] = useState<{ [key: string]: LiveDriverData }>({});
    const [positionsKey, setPositionsKey] = useState<number>(0);

    const hasRun = useRef(false);
    let driverData: LiveDriver[] = [];

    const startSession = async () => {
        let liveSession: LiveSession = await getLiveSession();
        setSession(liveSession);
        console.log(liveSession);
        let drivers: LiveDriver[] = await getLiveDrivers();
        driverData = drivers;
        console.log(drivers);
        let trackMap: Pos[] = await getTrackMap();
        console.log(trackMap);
        setMapPoints(trackMap);
        delayRef.current = ((new Date()).getTime() - date.getTime()) / 1000 + timeBefore;
        console.log(delayRef.current);
        loadData();
    };

    const loadData = async () => {
        let startLoad = new Date();
        let liveData: LiveData = await getLiveData(date);
        let telem = liveData.telemetry;
        let newTelemetryData = { ...telemetryData }; // Create a copy to update

        for (let i = 0; i < telem.length; i++) {
            telem[i].time = new Date(telem[i].time.getTime() + delayRef.current * 1000);
        }

        // Update telemetry data
        for (let i = 0; i < telem.length; i++) {
            if (telem[i].driverNum in newTelemetryData) {
                newTelemetryData[telem[i].driverNum].telemetry.push(telem[i]);
            } else {
                let driver: LiveDriver = driverData[driverData.map((x) => x.driverNumber).indexOf(telem[i].driverNum)];
                newTelemetryData[telem[i].driverNum] = { driver: driver, telemetry: [telem[i]], position: [] };
            }
        }

        // Update positions data
        let positions = liveData.positions;
        for (let i = 0; i < positions.length; i++) {
            positions[i].time = new Date(positions[i].time.getTime() + delayRef.current * 1000);
        }
        for (let i = 0; i < positions.length; i++) {
            if (positions[i].driverNum in newTelemetryData) {
                newTelemetryData[positions[i].driverNum].position.push(positions[i]);
            } else {
                let driver: LiveDriver = driverData[driverData.map((x) => x.driverNumber).indexOf(positions[i].driverNum)];
                newTelemetryData[positions[i].driverNum] = { driver: driver, telemetry: [], position: [positions[i]] };
            }
        }

        // Update state with the new telemetry data
        setTelemetryData(newTelemetryData);

        setPositionsKey(prevKey => prevKey + 1); // Increment positionsKey to trigger re-render
        console.log(`Time taken: ${((new Date()).getTime() - startLoad.getTime()) / 1000}`);
        date = new Date(date.getTime() + 2500);
        let loadDate = new Date(date.getTime() - timeBefore * 1000 + delayRef.current * 1000);
        let msDelay = (loadDate.getTime() - (new Date().getTime()));
        console.log(msDelay); // WAIT TIME
        console.log("SET STATE");
        const timeout = setTimeout(() => {
            loadData();
        }, msDelay);
    };

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        startSession();
    }, []);

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Navbar />

            <Box width={1200} height={800}>
                <TrackMapDisplay
                    points={mapPoints}
                    width={1200}
                    height={800}
                    rotationDeg={sessionData.rotation - 4}
                    driversData={telemetryData}
                />
            </Box>
        </ThemeProvider>
    );
}
