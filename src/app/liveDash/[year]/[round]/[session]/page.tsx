"use client";


import React, { useEffect, useRef, useState } from "react";
import darkTheme from "../../../../theme";
import { CssBaseline, ThemeProvider, Stack, Typography, Box, AppBar, Toolbar, IconButton, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Divider } from "@mui/material";
import Navbar from "../../../../components/Navbar";
import { FastestSectors, getAllLaps, getLiveData, getLiveDrivers, getLiveSession, getTrackMap, LiveData, LiveDriver, LiveDriverInterval, LiveDriverLap, LiveDriverPosition, LiveDriverSector, LiveDriverSectorTiming, LiveDriverTyre, LiveLapData, LivePosition, LiveSession, LiveTelemetry, Pos } from "../../../../utils/fetchLiveData";
import { TrackMapDisplay } from "../../../../components/live/TrackMapDisplay";
import { DisplayDriverData } from "../../../../components/live/DisplayDriverData";
import HomeIcon from '@mui/icons-material/Home';
import { fetchLiveTelemetryData } from "../../../../utils/fetchTelemetryData";
import { LiveAnalysis } from "../../../../components/live/LiveAnalysis";
import { useParams } from "next/navigation";
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import { dir } from "console";

export interface LiveDriverData {
    driver: LiveDriver;
    telemetry: LiveTelemetry[];
    position: LivePosition[];
    intervals: LiveDriverInterval[];
    sectors: LiveDriverSector[];
    tyres: LiveDriverTyre[];
    liveTiming: LiveDriverSectorTiming | undefined;
}



export default function LiveDash() {

    let delayToRealTime = 0;
    // let date: Date = new Date();
    let date: Date = new Date();
    const delayRef = useRef(0);
    const timeBefore = 1.25; // time before start to start download
    const isLive = useState<boolean>(true);

    let existant = true;

    const params = useParams();
    const year = params.year as string;
    const eventName = decodeURIComponent(params.round as string);
    const sessionName = decodeURIComponent(params.session as string);

    const [mapPoints, setMapPoints] = useState<Pos[]>([]);
    const [sessionData, setSession] = useState<LiveSession>(new LiveSession("", "", 0, "", 0, [], new Date()));
    const [telemetryData, setTelemetryData] = useState<{ [key: string]: LiveDriverData }>({});
    const [fastestLaps, setFastestLaps] = useState<{ [key: string]: LiveDriverLap }>({});
    const [fastestSectors, setFastestSectors] = useState<FastestSectors>({ s1: -1, s2: -1, s3: -1 });
    const [positionsKey, setPositionsKey] = useState<number>(0);
    const [lapNumber, setLapNumber] = useState<number>(0);

    const [driversSelected, setDriversSelected] = useState<number[]>([]);

    const [trackState, setTrackState] = useState<number>(0);

    const [driversActive, setDriversActive] = useState<number>(20);

    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(
        delayRef.current.toFixed(1)
    );

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

        return new Date(next);
    }

    const loadLiveAnalysis = async () => {
        setLiveDriverPositions(driverData.map((x) => x.driverNumber));
        let liveLaps = await getAllLaps(driverData.map((x) => x.driverNumber));
        setLiveLapsAnalysis(liveLaps);
    };

    const startSession = async () => {
        let liveSession: LiveSession = await getLiveSession(year, eventName, sessionName);
        const sessionEndDate = new Date(new Date(liveSession.startDate).getTime() + 7200000);
        const offsetInMinutes = new Date().getTimezoneOffset();
        const offsetInSeconds = -offsetInMinutes * 60;
        let currentDateOff = new Date((new Date()).getTime());
        if (currentDateOff < sessionEndDate) {
            date = getCurrentTime(currentDateOff);
        }
        else {
            date = new Date(liveSession.startDate);
            date = new Date(date.getTime() + offsetInSeconds * 1000);
            // date = getCurrentTime(currentDateOff);
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

    // const resetSession = (delay: number) => {
    //     let rDate = new Date((new Date()).getTime() - delay * 1000);
    //     date = new Date(rDate.getTime() - (rDate.getTime() % 2500));

    //     // setLiveDriverPositions([]);

    //     let telem: {[key: string]: LiveDriverData} = {};
    //     for (const [id, driver] of Object.entries(telemetryData)) {
    //         telemetryData[id] = {driver: driver.driver, telemetry: [], position: [], intervals: [], sectors: [], tyres: []};
    //     }


    //     console.log(date);
    //     const timeout = setTimeout(() => {
    //         loadData(true, delay);
    //     }, 2000);
    // };


    const loadData = async (original = false, delay = delayRef.current) => {


        let startLoad = new Date();
        let liveData: LiveData = await getLiveData(date, 20, year, eventName, sessionName);
        let telem = liveData.telemetry;
        let newTelemetryData = { ...telemetryData }; // Create a copy to update

        for (let i = 0; i < telem.length; i++) {
            telem[i].time = new Date(telem[i].time.getTime() + delay * 1000 - timeBefore * 1000 + 350);
        }

        // Update telemetry data
        for (let i = 0; i < telem.length; i++) {
            if (telem[i].driverNum in newTelemetryData) {
                newTelemetryData[telem[i].driverNum].telemetry.push(telem[i]);
            } else {
                let driver: LiveDriver = driverData[driverData.map((x) => x.driverNumber).indexOf(telem[i].driverNum)];
                newTelemetryData[telem[i].driverNum] = { driver: driver, telemetry: [telem[i]], position: [], intervals: [], sectors: [], tyres: [], liveTiming: undefined };
            }
        }

        // Update positions data
        let positions = liveData.positions;
        for (let i = 0; i < positions.length; i++) {
            positions[i].time = new Date(positions[i].time.getTime() + delay * 1000 - timeBefore * 1000 + 350);
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
                newTelemetryData[positions[i].driverNum] = { driver: driver, telemetry: [], position: [positions[i]], intervals: [], sectors: [], tyres: [], liveTiming: undefined };
            }
        }

        let intervals = liveData.driverIntervals;
        for (let i = 0; i < intervals.length; i++) {
            intervals[i].time = new Date(intervals[i].time.getTime() + delay * 1000 - timeBefore * 1000 + 350);
        }
        for (let i = 0; i < intervals.length; i++) {
            if (intervals[i].driverNum in newTelemetryData) {
                newTelemetryData[intervals[i].driverNum].intervals.push(intervals[i]);
            } else {
                let driver: LiveDriver = driverData[driverData.map((x) => x.driverNumber).indexOf(intervals[i].driverNum)];
                newTelemetryData[intervals[i].driverNum] = { driver: driver, telemetry: [], position: [], intervals: [intervals[i]], sectors: [], tyres: [], liveTiming: undefined };
            }
        }

        let sectors = liveData.driverSectors;
        for (let i = 0; i < sectors.length; i++) {
            sectors[i].time = new Date(sectors[i].time.getTime() + delay * 1000 - timeBefore * 1000 + 350);
        }
        for (let i = 0; i < sectors.length; i++) {
            if (sectors[i].driverNum in newTelemetryData) {
                newTelemetryData[sectors[i].driverNum].sectors.push(sectors[i]);
            } else {
                let driver: LiveDriver = driverData[driverData.map((x) => x.driverNumber).indexOf(sectors[i].driverNum)];
                newTelemetryData[sectors[i].driverNum] = { driver: driver, telemetry: [], position: [], sectors: [sectors[i]], intervals: [], tyres: [], liveTiming: undefined };
            }
        }

        let tyres = liveData.driverTyres;
        for (let i = 0; i < tyres.length; i++) {
            tyres[i].time = new Date(tyres[i].time.getTime() + delay * 1000 - timeBefore * 1000 + 350);
        }
        for (let i = 0; i < tyres.length; i++) {
            if (tyres[i].driverNum in newTelemetryData) {
                newTelemetryData[tyres[i].driverNum].tyres.push(tyres[i]);
            } else {
                let driver: LiveDriver = driverData[driverData.map((x) => x.driverNumber).indexOf(tyres[i].driverNum)];
                newTelemetryData[tyres[i].driverNum] = { driver: driver, telemetry: [], position: [], tyres: [tyres[i]], intervals: [], sectors: [], liveTiming: undefined };
            }
        }


        let liveSectors = liveData.driverLiveTiming;

        for (let i = 0; i < liveSectors.length; i++) {
            let liveSector = liveSectors[i];
            liveSector.time = new Date(liveSector.time.getTime() + delay * 1000 - timeBefore * 1000 + 350);
            if (liveSector.driverNum in newTelemetryData) {
                newTelemetryData[liveSector.driverNum].liveTiming = liveSector;
            } else {
                let driver: LiveDriver = driverData[driverData.map((x) => x.driverNumber).indexOf(liveSector.driverNum)];
                newTelemetryData[liveSector.driverNum] = { driver: driver, telemetry: [], position: [], tyres: [], intervals: [], sectors: [], liveTiming: liveSector };
            }
        }



        let driverPos = liveData.driverPositions;
        for (let i = 0; i < driverPos.length; i++) {
            let driverPosition = driverPos[i];
            driverPosition.time = new Date(driverPosition.time.getTime() + delay * 1000 - timeBefore * 1000 + 350);
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

        setFastestLaps(liveData.fastestLaps);
        setFastestSectors(liveData.fastestSectors);

        setDriversActive(liveData.driversActive);


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
        let loadDate = new Date(date.getTime() - timeBefore * 1000 + delay * 1000);
        let msDelay = (loadDate.getTime() - (new Date().getTime()));
        while (msDelay <= -2500) {
            date = new Date(date.getTime() + 2500);
            loadDate = new Date(date.getTime() - timeBefore * 1000 + delay * 1000);
            msDelay = (loadDate.getTime() - (new Date().getTime()));
        }
        if (msDelay > 2500) {
            let nDate = new Date((new Date()).getTime() - delay * 1000);
            date = new Date(nDate.getTime() - (nDate.getTime() % 2500));
            loadDate = new Date(date.getTime() - timeBefore * 1000 + delay * 1000);
            msDelay = (loadDate.getTime() - (new Date().getTime()));
        }
        const timeout = setTimeout(() => {
            loadData();
        }, msDelay);

        existant = true;
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


    const [open, setOpen] = useState(false);
    const [delayInput, setDelayInput] = useState(delayRef.current.toFixed(1));

    const handleOpen = () => {
        setDelayInput(delayRef.current.toFixed(1));
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSave = () => {
        const parsed = parseFloat(delayInput);
        if (!isNaN(parsed)) {
            delayRef.current = parsed;
        }
        setOpen(false);
    };







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
                            <Box
                                component="div"
                                flexDirection="row"
                                display="flex"
                                alignItems="center"
                                gap={0.6}
                                ml="auto"
                            >
                                <Typography variant="h6" color="inherit" noWrap>
                                    Delay:
                                </Typography>
                                <TextField
                                    size="small"
                                    variant="standard"
                                    type="number"
                                    value={isEditing ? inputValue : delayRef.current.toFixed(1)}
                                    InputProps={{
                                        disableUnderline: true,
                                        sx: {
                                            backgroundColor: 'rgba(255,255,255,0.08)',
                                            borderRadius: 1,
                                            px: 1,
                                            py: '4px',
                                            width: delayRef.current.toFixed(1).length * 13 + 14,

                                            '& input': {
                                                color: 'inherit',
                                                textAlign: 'center',
                                                MozAppearance: 'textfield',
                                            },

                                            // WebKit (Chrome, Safari, Edge)
                                            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                                WebkitAppearance: 'inner-spin-button',
                                                color: 'white',             // the arrow color
                                                backgroundColor: 'transparent', // transparent bg
                                                width: 'auto',
                                                margin: 0,
                                            },

                                            // Firefox
                                            '& input[type=number]': {
                                                MozAppearance: 'textfield',
                                            },
                                            '& input[type=number]::-moz-inner-spin-button, & input[type=number]::-moz-outer-spin-button': {
                                                MozAppearance: 'inner-spin-button',
                                                color: 'white',             // Firefox arrows
                                                backgroundColor: 'transparent',
                                            },
                                        },
                                    }}

                                    inputProps={{
                                        onKeyDown: (e) => {
                                            if (e.key === 'Enter') (e.currentTarget.blur());
                                        },
                                    }}
                                    onFocus={() => {
                                        setInputValue(delayRef.current.toFixed(1));
                                        setIsEditing(true);
                                    }}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onBlur={() => {
                                        const parsed = parseFloat(inputValue);
                                        if (!isNaN(parsed)) delayRef.current = parsed;
                                        setIsEditing(false);
                                    }}
                                />
                            </Box>
                        }
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
                        />
                    </Box>

                    <Box flexShrink={0}>
                        <DisplayDriverData
                            positions={driverPositionsConst}
                            drivers={telemetryData}
                            showTelem={false}
                            onClick={(driverNum: number) => {
                                console.log(driverNum);
                                let driversSelectedCopy = [...driversSelected];
                                if (driversSelectedCopy.includes(driverNum)) {
                                    driversSelectedCopy.splice(driversSelectedCopy.indexOf(driverNum), 1);
                                }
                                else {
                                    driversSelectedCopy.push(driverNum);
                                }
                                setDriversSelected(driversSelectedCopy);
                            }}
                            driversActive={driversActive}
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

            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Set Delay (seconds)</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Delay"
                        type="number"
                        fullWidth
                        value={delayInput}
                        onChange={(e) => setDelayInput(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogActions>
            </Dialog>

            <DriverPopupBar driversSelected={driversSelected} telemetry={telemetryData} positions={driverPositionsConst} fastestLaps={fastestLaps} fastestSectors={fastestSectors} />

        </ThemeProvider>
    );

}


interface StopwatchProps {
    startTime: Date;
}

const Stopwatch: React.FC<StopwatchProps> = ({ startTime }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const startMs = startTime.getTime();
        let rafId: number;

        const tick = () => {
            setElapsed(Date.now() - startMs);
            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [startTime]);


    const formatLapTime = (seconds: number): string => {
        if (seconds >= 60) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            const formattedSeconds = remainingSeconds.toFixed(3).padStart(6, '0'); // Ensures 2 digits + 3 decimals
            return `${minutes}:${formattedSeconds}`;
        }
        else {
            return seconds.toFixed(3);
        }
    };

    // Format as seconds.milliseconds
    const seconds = formatLapTime(elapsed / 1000);

    return (
        <Box
            sx={{
                bgcolor: '#333',
                color: '#fff',
                borderRadius: 1,
                px: 1.5,
                py: 0.5,
                minWidth: 60,
                textAlign: 'center',
            }}
        >
            <Typography variant="body2" component="span" fontFamily="monospace">
                {seconds}
            </Typography>
        </Box>
    );
};


interface SplitProps {
    sectorSplit: number;
    bestSectorSplit: number;
    chasing: string;
}

const SplitDisplay: React.FC<SplitProps> = ({ sectorSplit, bestSectorSplit, chasing }) => {


    const formatLapTime = (seconds: number): string => {
        if (seconds >= 60) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            const formattedSeconds = remainingSeconds.toFixed(3).padStart(6, '0'); // Ensures 2 digits + 3 decimals
            return `${minutes}:${formattedSeconds}`;
        }
        else {
            return seconds.toFixed(3);
        }
    };

    // Format as seconds.milliseconds
    const seconds = formatLapTime(sectorSplit);

    return (
        <Box
            display="flex"
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"   // ← vertically center children
            width="100%"
        >
            {/* Stopwatch box stays only as tall as its padding/font-size */}
            <Box
                sx={{
                    bgcolor: '#333',
                    color: '#fff',
                    borderRadius: 1,
                    px: 1.5,
                    py: 0.5,
                    minWidth: 60,
                    textAlign: 'center',
                }}
            >
                <Typography variant="body2" component="span" fontFamily="monospace">
                    {seconds}
                </Typography>
            </Box>


            {
                bestSectorSplit != 0 &&
                <Box justifyItems={"end"}>
                    <Typography variant="body2" fontWeight="bold">
                        {chasing}
                    </Typography>
                    <Typography
                        variant="body2"
                        component="span"
                        fontWeight="bold"
                        color={sectorSplit - bestSectorSplit < 0 ? '#0C0' : '#EDC001'}
                    >
                        {sectorSplit - bestSectorSplit >= 0 ? '+' : ''}
                        {(sectorSplit - bestSectorSplit).toFixed(3)}
                    </Typography>
                </Box>
            }
        </Box>
    );



};

const variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
};

interface DriverBadgeProps {
    driver: LiveDriverData;
    position: number;
    fastestLapSectors: LiveDriverLap;
    fastestSectors: FastestSectors;
    fastestLaps: { [key: string]: LiveDriverLap };
    telemetry: { [key: string]: LiveDriverData };
}

const DriverBadge: React.FC<DriverBadgeProps> = ({ driver, position, fastestLapSectors, fastestSectors, fastestLaps, telemetry }) => {

    const [lap, setLap] = useState<LiveDriverSector>({ driverNum: 0, duration: 0, pbDuration: 0, sectorNum: 0, time: new Date(), normalTiming: true });
    const [s1, setS1] = useState<LiveDriverSector>({ driverNum: 0, duration: 0, pbDuration: 0, sectorNum: 0, time: new Date(), normalTiming: true });
    const [s2, setS2] = useState<LiveDriverSector>({ driverNum: 0, duration: 0, pbDuration: 0, sectorNum: 0, time: new Date(), normalTiming: true });
    const [s3, setS3] = useState<LiveDriverSector>({ driverNum: 0, duration: 0, pbDuration: 0, sectorNum: 0, time: new Date(), normalTiming: true });

    const [normalS1, setNormalS1] = useState<boolean>(driver.liveTiming == undefined ? false : driver.liveTiming!.s1);
    const [normalS2, setNormalS2] = useState<boolean>(driver.liveTiming == undefined ? false : driver.liveTiming!.s2);
    const [normalS3, setNormalS3] = useState<boolean>(driver.liveTiming == undefined ? false : driver.liveTiming!.s3);

    const [split, setSplit] = useState<boolean>(false);

    const [splitProps, setSplitProps] = useState<SplitProps>({ sectorSplit: 0, bestSectorSplit: 0, chasing: "" });

    useEffect(() => {
        if (driver.liveTiming != undefined) {
            if (driver.liveTiming.s1 == false) {
                if (normalS3 || normalS2) {
                    setNormalS1(false);
                    setNormalS2(false);
                    setNormalS3(false);
                    setSplit(false);
                }
            }

            if (driver.liveTiming.s1) {
                setNormalS1(true);
            }
            if (driver.liveTiming.s2) {
                setNormalS2(true);
            }
            if (driver.liveTiming.s3) {
                setNormalS3(true);
            }
        }
    }, [driver]);

    useEffect(() => {
        if (driver.sectors.length === 0) return;

        let timeout2: ReturnType<typeof setTimeout> | null = null;

        const updateInterval = () => {
            const now = new Date();
            const sectors = driver.sectors;

            let timeUntil = -1;
            let currentLap;
            let currentS1;
            let currentS2;
            let currentS3;

            for (let i = 0; i < sectors.length; i++) {
                if (sectors[i].time.getTime() <= now.getTime()) {
                    if (sectors[i].sectorNum == 0) {
                        currentLap = sectors[i];
                    }
                    if (sectors[i].sectorNum == 1) {
                        currentS1 = sectors[i];
                    }
                    if (sectors[i].sectorNum == 2) {
                        currentS2 = sectors[i];
                    }
                    if (sectors[i].sectorNum == 3) {
                        currentS3 = sectors[i];
                    }
                } else {
                    timeUntil = sectors[i].time.getTime() - now.getTime();
                    break;
                }
            }

            if (currentLap) {
                setLap(currentLap);
            }
            if (currentS1) {
                setS1(currentS1);
                if (!currentS1.normalTiming || (currentS1.duration != s1.duration && s1.duration != 0)) {
                    setNormalS1(true);
                    setNormalS2(false);
                    setNormalS3(false);
                    setSplitProps({ chasing: getFastestDriver(), sectorSplit: s1.duration, bestSectorSplit: getFastestSplit(1) });
                    setSplit(true);
                    const timeout = setTimeout(() => {
                        setSplit(false);
                    }, 5000);
                }
            }
            if (currentS2) {
                setS2(currentS2);
                if (!currentS2.normalTiming || (currentS2.duration != s2.duration && s2.duration != 0)) {
                    setNormalS2(true);
                    setNormalS3(false);
                    setSplitProps({ chasing: getFastestDriver(), sectorSplit: s1.duration + s2.duration, bestSectorSplit: getFastestSplit(2) });
                    setSplit(true);
                    const timeout = setTimeout(() => {
                        setSplit(false);
                    }, 5000);
                }
            }
            if (currentS3) {
                setS3(currentS3);
                if (!currentS3.normalTiming || (currentS3.duration != s3.duration && s3.duration != 0)) {
                    setNormalS3(true);
                    setSplitProps({ chasing: getFastestDriver(), sectorSplit: s1.duration + s2.duration + s3.duration, bestSectorSplit: getFastestSplit(3) });
                    setSplit(true);
                }
            }

            if (timeUntil !== -1) {
                timeout2 = setTimeout(updateInterval, timeUntil);
            }
        };

        updateInterval();

        return () => {
            if (timeout2) clearTimeout(timeout2);
        };
    }, [driver.sectors]);

    const formatLapTime = (seconds: number): string => {
        if (seconds >= 60) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            const formattedSeconds = remainingSeconds.toFixed(3).padStart(6, '0'); // Ensures 2 digits + 3 decimals
            return `${minutes}:${formattedSeconds}`;
        }
        else {
            return seconds.toFixed(3);
        }
    };

    function getFastestLap(
        laps: Record<string, LiveDriverLap>
    ): LiveDriverLap | undefined {
        const allLaps = Object.values(laps).filter(lap =>
            lap.s1 !== 0 &&
            lap.s2 !== 0 &&
            lap.s3 !== 0
        );
        if (allLaps.length === 0) return undefined;

        return allLaps.reduce((fastest, current) =>
            current.lapTime < fastest.lapTime ? current : fastest
        );
    }

    function getFastestSplit(sector: number): number {
        let fl = getFastestLap(fastestLaps);
        if (fl == undefined) {
            return 0;
        }
        else {
            return (sector >= 1 ? fl.s1 : 0) + (sector >= 2 ? fl.s2 : 0) + (sector >= 3 ? fl.s3 : 0);
        }
    }

    function getFastestDriver(): string {
        let fl = getFastestLap(fastestLaps);
        if (fl == undefined) {
            return "";
        }
        else {
            return telemetry[fl.driverNum.toString()].driver.driver;
        }
    }

    function getFastestSplitTime(): string {
        let fl = getFastestLap(fastestLaps);
        if (fl == undefined) {
            return "";
        }
        else {
            return formatLapTime((normalS1 || normalS2 || normalS3 ? fl.s2 : 0) + (normalS2 || normalS3 ? fl.s3 : 0) + fl.s1);
        }
    }

    console.log(driver.liveTiming);


    return <Box
        sx={{
            bgcolor: '#222',
            color: '#fff',
            borderRadius: 1,
            width: 270,
            height: 170,
            textAlign: 'center',
            boxShadow: 3,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'start',
            justifyContent: 'space-between',
        }}
    >
        {/* <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: driver.driver.teamColour,
                borderRadius: 1,
                px: 1,
                py: 0.5,
                color: 'white',
                fontFamily: 'sans-serif',
                fontWeight: 'bold',
                width: 80,
                height: 35,
            }}
        >
            <Box sx={{ fontSize: 16 }}>{position}</Box>
            <Box
                sx={{
                    bgcolor: 'white',
                    color: driver.driver.teamColour,
                    borderRadius: 1,
                    width: 40,
                    height: 27,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                }}
            >
                {driver.driver.driver}
            </Box>
        </Box> */}

        <Box
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "start",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontSize: "18px",
                height: "37px",
                cursor: "pointer",
                backgroundColor: "#FFF3",
                textTransform: "none",
                padding: "12px"
            }}
        >
            {/* Position Number */}
            <div style={{
                fontSize: "17px",
                marginRight: "10px",
                fontWeight: "bold",
                display: "flex",
                justifyContent: "flex-end",
            }}>
                {position}
            </div>

            {/* Vertical Bar with Team Color */}
            <div style={{
                backgroundColor: driver.driver.teamColour,
                width: "5px",
                height: "26px",
                marginRight: "8px"
            }} />

            {/* Driver Name */}
            <div style={{ display: "flex", alignItems: "baseline", fontWeight: "bold" }}>
                <span style={{ fontWeight: "bold", fontSize: "17px" }}>
                    {driver.driver.driver.split(" ")}
                </span>
            </div>
        </Box>

        {driver.liveTiming && (
            split ?
                <SplitDisplay chasing={splitProps.chasing} sectorSplit={((normalS1 || normalS2 || normalS3) ? s1.duration : 0) + ((normalS2 || normalS3) ? s2.duration : 0) + ((normalS3) ? s3.duration : 0)} bestSectorSplit={splitProps.bestSectorSplit} />
                :
                <Box
                    display="flex"
                    flexDirection="row"
                    justifyContent="space-between"
                    alignItems="center"
                    width="100%"
                >
                    <Stopwatch startTime={driver.liveTiming.time} />
                    {
                        getFastestLap(fastestLaps)?.lapTime != 0 &&
                        <Box justifyItems={"end"}>
                            <Typography variant="body2" fontWeight="bold">
                                {getFastestDriver()}
                            </Typography>
                            <Typography
                                variant="body2"
                                component="span"
                                fontWeight="bold"
                                color={"#AAA"}
                            >
                                {getFastestSplitTime()}
                            </Typography>
                        </Box>
                    }
                </Box>
        )}

        {/* Centered horizontal divider */}
        {/* <Divider
            sx={{
                width: 100,
                height: 2,
                bgcolor: '#444',
                mx: 'auto',
            }}
        /> */}

        {/* You can put more content below the divider */}
        {driver.liveTiming != undefined &&
            <Box
                height={40}
                sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",       // ← fill all horizontal space
                    // flexGrow: 1,      // ← alternatively, if parent is flex, this will make it expand
                }}
            >
                <Box alignContent={"center"} fontWeight={"bold"} fontFamily={"monospace"} borderRadius={"5px 0px 0px 5px"} width={77} paddingY={0.6} color={(normalS1 || driver.liveTiming.s1) ? (s1.duration <= fastestLapSectors.s1 || fastestLapSectors.s1 == 0) ? "white" : "#333" : "#BBB"} bgcolor={(normalS1 || driver.liveTiming.s1) ? (s1.duration <= fastestSectors.s1 || fastestSectors.s1 == 0) ? "#db34eb" : (s1.duration <= fastestLapSectors.s1 || fastestLapSectors.s1 == 0) ? "#00AA00" : "#CFD600" : "#FFFFFF22"}>{(normalS1 || driver.liveTiming.s1) ? formatLapTime(s1.duration) : "S1"}</Box>
                <Box alignContent={"center"} fontWeight={"bold"} fontFamily={"monospace"} width={77} paddingY={0.6} color={((normalS2 || driver.liveTiming.s2) && (normalS1 || driver.liveTiming.s1)) ? (s1.duration + s2.duration <= fastestLapSectors.s1 + fastestLapSectors.s2 || fastestLapSectors.s1 == 0 || fastestLapSectors.s2 == 0 || s2.duration <= fastestSectors.s2) ? "white" : "#333" : "#BBB"} bgcolor={(normalS2 || driver.liveTiming.s2 && (normalS1 || driver.liveTiming.s1)) ? (s2.duration <= fastestSectors.s2 || fastestSectors.s2 == 0) ? "#db34eb" : (s1.duration + s2.duration <= fastestLapSectors.s1 + fastestLapSectors.s2 || fastestLapSectors.s1 == 0 || fastestLapSectors.s2 == 0) ? "#00AA00" : "#CFD600" : "#FFFFFF22"}>{(normalS2 || driver.liveTiming.s2) ? formatLapTime(s1.duration + s2.duration) : "S2"}</Box>
                <Box alignContent={"center"} fontWeight={"bold"} fontFamily={"monospace"} borderRadius={"0px 5px 5px 0px"} width={77} paddingY={0.6} color={((normalS3 || driver.liveTiming.s3) && (normalS2 || driver.liveTiming.s2) && (normalS1 || driver.liveTiming.s1)) ? (s1.duration + s2.duration + s3.duration <= fastestLapSectors.s1 + fastestLapSectors.s2 + fastestLapSectors.s3 || fastestLapSectors.s3 == 0 || s3.duration <= fastestSectors.s3 || fastestLapSectors.s1 == 0 || fastestLapSectors.s2 == 0) ? "white" : "#333" : "#BBB"} bgcolor={((normalS3 || driver.liveTiming.s3) && (normalS2 || driver.liveTiming.s2) && (normalS1 || driver.liveTiming.s1)) ? (s3.duration <= fastestSectors.s3 || fastestSectors.s3 == 0) ? "#db34eb" : (s1.duration + s2.duration + s3.duration <= fastestLapSectors.s1 + fastestLapSectors.s2 + fastestLapSectors.s3 || fastestLapSectors.s1 == 0 || fastestLapSectors.s2 == 0 || fastestLapSectors.s3 == 0) ? "#00AA00" : "#CFD600" : "#FFFFFF22"}>{(normalS3 || driver.liveTiming.s3) ? formatLapTime(s1.duration + s2.duration + s3.duration) : "S3"}</Box>
            </Box>
        }
    </Box>
};

// Container that renders multiple DriverBadge components at the bottom
interface DriverPopupBarProps {
    driversSelected: number[];
    telemetry: { [key: string]: LiveDriverData };
    positions: LiveDriverPosition[];
    fastestSectors: FastestSectors;
    fastestLaps: { [key: string]: LiveDriverLap };
}

const DriverPopupBar: React.FC<DriverPopupBarProps> = ({ driversSelected, telemetry, positions, fastestSectors, fastestLaps }) => {

    const [currentPositions, setCurrentPositions] = useState<number[]>([]);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        const updatePositions = () => {
            let currentPos: number[] = [];
            let timeUntil: number = -1;
            for (let i = 0; i < positions.length; i++) {
                if (positions[i].time <= new Date()) {
                    currentPos = positions[i].driverNums;
                }
                else {
                    timeUntil = (positions[i].time.getTime() - (new Date()).getTime());
                    break;
                }
            }

            setCurrentPositions(currentPos);

            if (timeUntil != -1) {
                timeout = setTimeout(updatePositions, timeUntil);
            }
        };

        updatePositions();
    }, [positions]);

    return (
        <Box
            component="footer"
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                width: '100%',
                pointerEvents: 'none',
                zIndex: (theme) => theme.zIndex.tooltip,
                py: 1,
                backgroundColor: 'transparent',
                display: 'flex',
                justifyContent: 'center',
            }}
        >
            <Stack direction="row" spacing={1}>
                {driversSelected.map((driver) => (
                    <DriverBadge fastestLaps={fastestLaps} key={driver} driver={telemetry[driver.toString()]} position={currentPositions.indexOf(driver) + 1} fastestLapSectors={fastestLaps[driver.toString()]} fastestSectors={fastestSectors} telemetry={telemetry} />
                ))}
            </Stack>
        </Box>
    );
};