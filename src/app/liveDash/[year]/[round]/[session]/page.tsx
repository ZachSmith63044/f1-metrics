"use client";


import React, { useEffect, useRef, useState } from "react";
import darkTheme from "../../../../theme";
import { CssBaseline, ThemeProvider, Stack, Typography, Box, AppBar, Toolbar, IconButton } from "@mui/material";
import Navbar from "../../../../components/Navbar";
import { getAllLaps, getLiveData, getLiveDrivers, getLiveSession, getTrackMap, LiveData, LiveDriver, LiveDriverInterval, LiveDriverPosition, LiveDriverSector, LiveDriverTyre, LiveLapData, LivePosition, LiveSession, LiveTelemetry, Pos } from "../../../../utils/fetchLiveData";
import { TrackMapDisplay } from "../../../../components/live/TrackMapDisplay";
import { DisplayDriverData } from "../../../../components/live/DisplayDriverData";
import HomeIcon from '@mui/icons-material/Home';
import { fetchLiveTelemetryData } from "../../../../utils/fetchTelemetryData";
import { LiveAnalysis } from "../../../../components/live/LiveAnalysis";
import { useParams } from "next/navigation";

export interface LiveDriverData {
    driver: LiveDriver;
    telemetry: LiveTelemetry[];
    position: LivePosition[];
    intervals: LiveDriverInterval[];
    sectors: LiveDriverSector[];
    tyres: LiveDriverTyre[];
}



export default function LiveDash() {

    let delayToRealTime = 54;
    // let date: Date = new Date();
    let date: Date = new Date(2025, 4, 25, 14, 17, 50);
    const delayRef = useRef(0);
    const timeBefore = 1.25; // time before start to start download

    const params = useParams();
    const year = params.year as string;
    const eventName = decodeURIComponent(params.round as string);
    const sessionName = decodeURIComponent(params.session as string);

    const [mapPoints, setMapPoints] = useState<Pos[]>([]);
    const [sessionData, setSession] = useState<LiveSession>(new LiveSession("", "", 0, "", 0, [], new Date()));
    const [telemetryData, setTelemetryData] = useState<{ [key: string]: LiveDriverData }>({});
    const [positionsKey, setPositionsKey] = useState<number>(0);
    const [lapNumber, setLapNumber] = useState<number>(0);

    const [trackState, setTrackState] = useState<number>(0);

    const [liveLapsAnalysis, setLiveLapsAnalysis] = useState<Record<number, LiveLapData[]>>({});

    // const [marshalSectors, setMarshalSectors] = useState<LiveMarshalSectors[]>([]);

    const hasRun = useRef(false);
    let driverData: LiveDriver[] = [];
    const [driverDataConst, setDriverDataConst] = useState<LiveDriver[]>([]);
    let driverPositions: LiveDriverPosition[] = [];
    const [driverPositionsConst, setDriverPositions] = useState<LiveDriverPosition[]>([]);
    const [currentDriverPositions, setCurrentPosition] = useState<LiveDriverPosition | undefined>();
    const [liveDriverPositions, setLiveDriverPositions] = useState<number[]>([]);
    // const [driverIntervals, setDriverIntervals] = useState<LiveDriverInterval[]>([]);

    function getCurrentTime(date: Date): Date {
        let dateTime = date.getTime() - 8000 - delayToRealTime * 1000;
        const next = dateTime - dateTime % 2500;

        console.log(new Date(next));
        console.log("DATE");
        console.log("REUSE")

        console.log((new Date(next)).getMilliseconds())

        return new Date(next);
    }

    const loadLiveAnalysis = async () => {
        setLiveDriverPositions(driverData.map((x) => x.driverNumber));
        let liveLaps = await getAllLaps(driverData.map((x) => x.driverNumber));
        setLiveLapsAnalysis(liveLaps);
    };

    const startSession = async () => {
        let liveSession: LiveSession = await getLiveSession(year, eventName, sessionName);
        console.log(liveSession.startDate);
        console.log("UP SD");
        const sessionEndDate = new Date(new Date(liveSession.startDate).getTime() + 7200000);
        if (new Date() < sessionEndDate) {
            // date = getCurrentTime(new Date());
        }
        else {
            console.log(date);
            date = new Date(liveSession.startDate);
            console.log(date);
        }

        setSession(liveSession);
        let drivers: LiveDriver[] = await getLiveDrivers(year, eventName, sessionName);
        setDriverDataConst(drivers);
        driverData = drivers;
        let trackMap: Pos[] = await getTrackMap(year, eventName, sessionName);
        setMapPoints(trackMap);
        delayRef.current = ((new Date()).getTime() - date.getTime()) / 1000 + timeBefore;
        loadData();
        loadLiveAnalysis();
    };

    const loadData = async () => {
        let startLoad = new Date();
        let liveData: LiveData = await getLiveData(date, 20, year, eventName, sessionName);
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
                if (driverData.map((x) => x.driverNumber).includes(positions[i].driverNum)) {
                    newTelemetryData[positions[i].driverNum].position.push(positions[i]);
                }
            } else {
                if (driverData[driverData.map((x) => x.driverNumber).indexOf(positions[i].driverNum)] == undefined) {
                    console.log(`safety CAR: ${positions[i].driverNum}`)
                }
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
        if (driverPositions.length == 0) {
            setLiveDriverPositions(driverData.map((driver) => driver.driverNumber));
        }
        else {
            setLiveDriverPositions(driverPositions[driverPositions.length - 1].driverNums);
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
        }
        else if (driverPositions.length > 0) {
            setCurrentPosition(driverPositions[driverPositions.length - 1]);
        }


        // let liveMarshalSectors: LiveMarshalSectors[] = liveData.marshalSectors;

        // for (let i = 0; i < liveMarshalSectors.length; i++)
        // {
        //     liveMarshalSectors[i].time =  new Date(liveMarshalSectors[i].time.getTime() + delayRef.current * 1000 - timeBefore * 1000 + 350);
        // }

        // let allSectors = [...marshalSectors, ...liveMarshalSectors];

        // setMarshalSectors(allSectors);

        // console.log(allSectors);



        setDriverPositions([...driverPositions]);

        // Update state with the new telemetry data
        setTelemetryData(newTelemetryData);

        setLapNumber(liveData.lapNumber);

        // const timeout2 = setTimeout(() => {
        //     setTrackState(liveData.trackState);
        //     // your action here
        // }, 2500);
        setTrackState(liveData.trackState);
        setPositionsKey(prevKey => prevKey + 1); // Increment positionsKey to trigger re-render
        date = new Date(date.getTime() + 2500);
        let loadDate = new Date(date.getTime() - timeBefore * 1000 + delayRef.current * 1000);
        let msDelay = (loadDate.getTime() - (new Date().getTime()));
        const timeout = setTimeout(() => {
            loadData();
        }, msDelay);
    };

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        startSession();
    }, []);

    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(3200);
    const [containerHeight, setContainerHeight] = useState(1400);
    const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);


    useEffect(() => {
        const updateSizes = () => {
            setWindowWidth(window.innerWidth);
            if (containerRef.current) {
                const fullWidth = containerRef.current.offsetWidth;
                const maxHeight = window.innerHeight * 0.9;
                const maxMapWidth = (3 * maxHeight) / 2;
                setContainerWidth(fullWidth); // -850
                setContainerHeight(window.innerHeight * 0.9);
            }
        };

        updateSizes();
        window.addEventListener('resize', updateSizes);
        return () => window.removeEventListener('resize', updateSizes);
    }, []);

    const mapHeight = (2 * containerWidth) / 3;
    const isWide = windowWidth > 1650;

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />

            <AppBar position="static" color="default" elevation={2} sx={{ backgroundColor: '#121212' }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <IconButton
                            size="small"
                            edge="start"
                            color="inherit"
                            aria-label="home"
                            sx={{ p: 0.5 }}
                            onClick={() => {
                                // Replace this with your navigation logic
                                window.location.href = '/';
                            }}
                        >
                            <HomeIcon fontSize="small" />
                        </IconButton>

                        {/* Flag image */}
                        {sessionData.country && (
                            <img
                                src={`/flags/${sessionData.country}.svg`}
                                alt={`${sessionData.country} flag`}
                                style={{ width: 30, height: 23, marginLeft: 4 }}
                            />
                        )}

                        <Typography variant="h6" color="inherit" noWrap fontWeight="bold">
                            {sessionData.name} — {sessionData.session}
                        </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" gap={3}>
                        {
                            sessionData.session == "Race" &&
                            <Typography variant="h6" color="inherit" noWrap>
                                Lap {lapNumber}/{sessionData.laps}
                            </Typography>
                        }

                        {
                            trackState === 7 ? (
                                <Box
                                    sx={{
                                        backgroundColor: "black",
                                        color: "white",
                                        fontWeight: "bold",
                                        width: "140px",
                                        borderRadius: 2,
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        height: "100%",
                                        py: 0.5,
                                        border: "2px solid white",
                                    }}
                                >
                                    Chequered Flag
                                </Box>
                            ) : (
                                <Box
                                    sx={{
                                        backgroundColor: ["#00ad62", "#c40000", "#c8d422", "#c8d422", "#c8d422", "#c8d422", "#c8d422"][trackState],
                                        fontWeight: "bold",
                                        width: "115px",
                                        borderRadius: 2,
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        height: "100%",
                                        py: 0.5,

                                        // Conditional outline styles
                                        outline:
                                            trackState === 2 ? "3px solid #FF2222" :
                                                trackState === 4 ? "3px dashed #FF2222" :
                                                    trackState === 3 ? "3px solid #FF2222" :
                                                        trackState === 5 ? "3px dashed #FF2222" :
                                                            "none",

                                        animation:
                                            trackState === 3 ? "flash-outline 2s infinite" :
                                                trackState === 5 ? "flash-outline 2s infinite" :
                                                    "none",
                                    }}
                                >
                                    <Typography fontWeight={"bold"}>
                                        {["Track Clear", "Red Flag", "SC", "SC Ending", "VSC", "VSC Ending", "Yellow Flag"][trackState]}
                                    </Typography>
                                </Box>
                            )
                        }
                    </Box>

                </Toolbar>
            </AppBar>

            <Box ref={containerRef} width="100%" px={1}>
                <Box
                    display="flex"
                    flexDirection={isWide ? 'row' : 'column'}
                    gap={2}
                    alignItems={isWide ? 'flex-start' : 'center'}
                    justifyContent="center"
                    width="100%"
                >
                    <Box
                        flexGrow={isWide ? 1 : 0}
                        minWidth={isWide ? 600 : containerWidth}
                        maxWidth={isWide ? 1400 : containerWidth}
                        height={isWide ? containerHeight : mapHeight}
                    >
                        <TrackMapDisplay
                            points={mapPoints}
                            width={isWide ? containerWidth - 750 : containerWidth}
                            height={isWide ? containerHeight : mapHeight}
                            rotationDeg={sessionData.rotation - 4}
                            driversData={telemetryData}
                            positions={currentDriverPositions?.driverNums ?? []}
                        // marshalSectors={sessionData.marshalSectors}
                        // sectorStates={marshalSectors.length > 0 ? marshalSectors[marshalSectors.length - 1].sectorStates : [2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]}
                        />
                    </Box>

                    <Box flexShrink={0}>
                        <DisplayDriverData
                            positions={driverPositionsConst}
                            drivers={telemetryData}
                            showTelem={false}
                        />
                    </Box>
                </Box>
                {/* <Box padding={"20px"}>
                    <LiveAnalysis lapsData={liveLapsAnalysis} positions={liveDriverPositions} drivers={driverDataConst.reduce(
                        (acc, driver) => {
                            acc[driver.driverNumber] = driver;
                            return acc;
                        },
                        {} as Record<number, LiveDriver>
                    )} />
                </Box> */}
            </Box>
        </ThemeProvider>
    );

}
