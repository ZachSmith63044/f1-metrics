"use client";


import React, { useEffect, useRef, useState } from "react";
import darkTheme from "../theme";
import { CssBaseline, ThemeProvider, Stack, Typography, Box } from "@mui/material";
import Navbar from "../components/Navbar";
import { getLiveData, getLiveDrivers, getLiveSession, getTrackMap, LiveData, LiveDriver, LiveDriverInterval, LiveDriverPosition, LiveDriverSector, LiveDriverTyre, LivePosition, LiveSession, LiveTelemetry, Pos } from "../utils/fetchLiveData";
import { TrackMapDisplay } from "../components/live/TrackMapDisplay";
import { DisplayDriverData } from "../components/live/DisplayDriverData";

export interface LiveDriverData {
    driver: LiveDriver;
    telemetry: LiveTelemetry[];
    position: LivePosition[];
    intervals: LiveDriverInterval[];
    sectors: LiveDriverSector[];
    tyres: LiveDriverTyre[];
}

export default function LiveDash() {
    let date: Date = new Date("2025-05-04T20:10:00+00:00");
    const delayRef = useRef(0);
    const timeBefore = 1.25; // time before start to start download

    const [mapPoints, setMapPoints] = useState<Pos[]>([]);
    const [sessionData, setSession] = useState<LiveSession>(new LiveSession("", "", 0));
    const [telemetryData, setTelemetryData] = useState<{ [key: string]: LiveDriverData }>({});
    const [positionsKey, setPositionsKey] = useState<number>(0);

    const hasRun = useRef(false);
    let driverData: LiveDriver[] = [];
    let driverPositions: LiveDriverPosition[] = [];
    const [driverPositionsConst, setDriverPositions] = useState<LiveDriverPosition[]>([]);
    const [currentDriverPositions, setCurrentPosition] = useState<LiveDriverPosition | undefined>();
    const [driverIntervals, setDriverIntervals] = useState<LiveDriverInterval[]>([]);

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
        console.log(`delayRef.current = ${delayRef.current}`);
        loadData();
    };

    const loadData = async () => {
        let startLoad = new Date();
        let liveData: LiveData = await getLiveData(date);
        let telem = liveData.telemetry;
        let newTelemetryData = { ...telemetryData }; // Create a copy to update

        for (let i = 0; i < telem.length; i++) {
            telem[i].time = new Date(telem[i].time.getTime() + delayRef.current * 1000 - timeBefore * 1000 + 350);
        }

        // Update telemetry data
        for (let i = 0; i < telem.length; i++) {
            if (telem[i].driverNum in newTelemetryData) {
                newTelemetryData[telem[i].driverNum].telemetry.push(telem[i]);
            } else {
                let driver: LiveDriver = driverData[driverData.map((x) => x.driverNumber).indexOf(telem[i].driverNum)];
                newTelemetryData[telem[i].driverNum] = { driver: driver, telemetry: [telem[i]], position: [], intervals: [], sectors: [], tyres: [] };
            }
        }

        // Update positions data
        let positions = liveData.positions;
        for (let i = 0; i < positions.length; i++) {
            positions[i].time = new Date(positions[i].time.getTime() + delayRef.current * 1000 - timeBefore * 1000 + 350);
        }
        for (let i = 0; i < positions.length; i++) {
            if (positions[i].driverNum in newTelemetryData) {
                newTelemetryData[positions[i].driverNum].position.push(positions[i]);
            } else {
                let driver: LiveDriver = driverData[driverData.map((x) => x.driverNumber).indexOf(positions[i].driverNum)];
                newTelemetryData[positions[i].driverNum] = { driver: driver, telemetry: [], position: [positions[i]], intervals: [], sectors: [], tyres: [] };
            }
        }

        let intervals = liveData.driverIntervals;
        for (let i = 0; i < intervals.length; i++) {
            intervals[i].time = new Date(intervals[i].time.getTime() + delayRef.current * 1000 - timeBefore * 1000 + 350);
        }
        for (let i = 0; i < intervals.length; i++) {
            if (intervals[i].driverNum in newTelemetryData) {
                newTelemetryData[intervals[i].driverNum].intervals.push(intervals[i]);
            } else {
                let driver: LiveDriver = driverData[driverData.map((x) => x.driverNumber).indexOf(intervals[i].driverNum)];
                newTelemetryData[intervals[i].driverNum] = { driver: driver, telemetry: [], position: [], intervals: [intervals[i]], sectors: [], tyres: [] };
            }
        }

        let sectors = liveData.driverSectors;
        for (let i = 0; i < sectors.length; i++) {
            sectors[i].time = new Date(sectors[i].time.getTime() + delayRef.current * 1000 - timeBefore * 1000 + 350);
        }
        for (let i = 0; i < sectors.length; i++) {
            if (sectors[i].driverNum in newTelemetryData) {
                newTelemetryData[sectors[i].driverNum].sectors.push(sectors[i]);
            } else {
                let driver: LiveDriver = driverData[driverData.map((x) => x.driverNumber).indexOf(sectors[i].driverNum)];
                newTelemetryData[sectors[i].driverNum] = { driver: driver, telemetry: [], position: [], sectors: [sectors[i]], intervals: [], tyres: [] };
            }
        }

        let tyres = liveData.driverTyres;
        for (let i = 0; i < tyres.length; i++) {
            tyres[i].time = new Date(tyres[i].time.getTime() + delayRef.current * 1000 - timeBefore * 1000 + 350);
        }
        for (let i = 0; i < tyres.length; i++) {
            if (tyres[i].driverNum in newTelemetryData) {
                newTelemetryData[tyres[i].driverNum].tyres.push(tyres[i]);
            } else {
                let driver: LiveDriver = driverData[driverData.map((x) => x.driverNumber).indexOf(tyres[i].driverNum)];
                newTelemetryData[tyres[i].driverNum] = { driver: driver, telemetry: [], position: [], tyres: [tyres[i]], intervals: [], sectors: [] };
            }
        }


        let driverPos = liveData.driverPositions;
        for (let i = 0; i < driverPos.length; i++) {
            let driverPosition = driverPos[i];
            driverPosition.time = new Date(driverPosition.time.getTime() + delayRef.current * 1000 - timeBefore * 1000 + 350);
            driverPositions.push(driverPosition);
        }
        let currentPos: undefined | LiveDriverPosition;
        for (let i = 0; i < driverPositions.length; i++) {
            if (driverPositions[i].time <= new Date()) {
                currentPos = driverPositions[i];
            }
            else {
                break;
            }
        }
        if (currentPos != undefined) {
            setCurrentPosition(currentPos);
            console.log(currentPos);
            console.log("POS SET ABOVE");
        }
        else if (driverPositions.length > 0) {
            setCurrentPosition(driverPositions[driverPositions.length - 1]);
            console.log(driverPositions[driverPositions.length - 1]);
            console.log("POS SET ABOVE");
        }

        console.log(driverPositions.length);
        console.log("DRIVER-POS SET ABOVE");
        setDriverPositions([...driverPositions]);

        // Update state with the new telemetry data
        setTelemetryData(newTelemetryData);
        console.log(newTelemetryData);

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
        console.log("Updated driver positions:", driverPositionsConst);
    }, [driverPositionsConst]);

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
                    positions={currentDriverPositions == undefined ? [] : currentDriverPositions.driverNums}
                />
            </Box>
            <DisplayDriverData positions={driverPositionsConst} drivers={telemetryData} showTelem={true} />
        </ThemeProvider>
    );
}
