"use client";

import { useEffect, useState } from "react";
import darkTheme from "../../../../theme";
import { CssBaseline, ThemeProvider, Stack, Typography, Box, ToggleButtonGroup, ToggleButton } from "@mui/material";
import Navbar from "../../../../components/Navbar";
import { useParams } from "next/navigation";
import { fetchPracticeResult, fetchQualiResult, fetchRaceResult, PracticeResult, QualiResult, RaceResult } from "@/app/utils/fetchResults";
import { PracticeResultsTable, QualiResultsTable, RaceResultsTable } from "@/app/components/DisplayResults";
import { LapData } from "@/app/classes/lapData";
import { fetchSessionData } from "@/app/utils/fetchSessionData";
import { DriverData } from "@/app/classes/driverData";
import TyreStrategyChart, { DriverStrategy } from "@/app/components/StrategyWidget";
import PitPerformanceChart from "@/app/components/PitPerformance";
import LapChart from "@/app/components/LapChart";
import SpeedsChart from "@/app/components/MaxSpeeds";
import PositionChanges from "@/app/components/PositionChanges";
import SpeedDistance from "@/app/components/SpeedDistance";

export default function SessionDash() {
    const [selection, setSelection] = useState("results");

    const [lapsData, setLapsData] = useState<LapData[][]>([[]]);
    const [driverData, setDriverData] = useState<DriverData[]>([]);
    const [drivers, setDrivers] = useState<string[]>([]);



    const params = useParams();
    const year = params.year as string;
    const round = decodeURIComponent(params.round as string);
    const session = decodeURIComponent(params.session as string);


    const [results, setResults] = useState<(any)[]>([]);


    const handleChange = (_: React.MouseEvent<HTMLElement>, newSelection: string | null) => {
        if (newSelection !== null) {
            setSelection(newSelection);
        }
    };

    const fetchResults = async () => {
        let res = [];
        if (session == "Race" || session == "Sprint") {
            const results: RaceResult[] = await fetchRaceResult(year, round, session);
            console.log(results);
            res = results;
            setResults(results);
        }
        else if (session == "Qualifying" || session == "Sprint Qualifying" || session == "Sprint Shootout") {
            const results: QualiResult[] = await fetchQualiResult(year, round, session);
            console.log(results);
            res = results;
            setResults(results);
        }
        else {
            const results: PracticeResult[] = await fetchPracticeResult(year, round, session);
            console.log(results);
            res = results;
            setResults(results);
        }

        fetchLaps(res);
    }

    const fetchLaps = async (results: any[]) => {
        let data = await fetchSessionData(year, round, session);

        let lapsOld = data.allLapsData;
        let driverDataOld = data.driversData;
        let driversOld = data.driverIds;

        let newLaps = [];
        let newDriverData = [];
        let newDrivers = [];

        for (let i = 0; i < results.length; i++) {
            for (let j = 0; j < driverDataOld.length; j++) {
                if (driverDataOld[j].firstName + " " + driverDataOld[j].lastName == results[i].name) {
                    newLaps.push(lapsOld[j]);
                    newDriverData.push(driverDataOld[j]);
                    newDrivers.push(driversOld[j]);
                    break;
                }
            }
        }

        console.log(results);
        console.log("RESULTS");

        setLapsData(newLaps);
        setDriverData(newDriverData);
        setDrivers(newDrivers);

        console.log(data);
    }

    useEffect(() => {
        fetchResults();
    }, []);

    const toggleSx = {
        '&.Mui-selected': {
            backgroundColor: '#cccccc', // light grey
            color: 'black',
            '&:hover': {
                backgroundColor: '#bbbbbb', // slightly darker on hover
            },
        },
    };

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Navbar />
            <Box justifyContent={"center"} justifyItems={"center"} mt={"20px"} >
                <ToggleButtonGroup
                    value={selection}
                    exclusive
                    onChange={handleChange}
                    size="small"
                    sx={{ borderRadius: 5 }}
                >
                    <ToggleButton value="results" sx={toggleSx}>
                        Results
                    </ToggleButton>
                    <ToggleButton value="strategy" sx={toggleSx}>
                        Strategy
                    </ToggleButton>
                    {
                        (session === "Race" || session === "Sprint") && (
                            <ToggleButton value="positions" sx={toggleSx}>
                                Position Changes
                            </ToggleButton>
                        )
                    }

                    <ToggleButton value="laptimes" sx={toggleSx}>
                        Lap Times
                    </ToggleButton>
                    {
                        session == "Race" &&
                        <ToggleButton value="pitperformance" sx={toggleSx}>
                            Pit Performance
                        </ToggleButton>
                    }
                    <ToggleButton value="maxspeed" sx={toggleSx}>
                        Min/Max Speed
                    </ToggleButton>
                    <ToggleButton value="telemetry" sx={toggleSx}>
                        Telemetry Comparison
                    </ToggleButton>
                </ToggleButtonGroup>

                {
                    selection == "results" ?
                        (
                            (session == "Race" || session == "Sprint") ? <RaceResultsTable results={results} year={year} round={round} session={session} /> :
                                (session == "Qualifying" || session == "Sprint Qualifying" || session == "Sprint Shootout") ? <QualiResultsTable results={results} year={year} round={round} session={session} /> :
                                    <PracticeResultsTable results={results} year={year} round={round} session={session} />
                        )
                        :
                        selection == "strategy" ?
                            <Box padding={3} width={"1200px"} maxWidth={"100%"} alignItems={"center"}>
                                <Typography fontWeight={"bold"} fontSize={22} sx={{ mb: 2 }}>
                                    {year} {round.slice(3)} {session} Strategy
                                </Typography>
                                {
                                    lapsData.length > 1 ?
                                        <TyreStrategyChart laps={lapsData} drivers={driverData} clickable={false} onClick={(laps, index, add) => { }} />
                                        :
                                        <Typography>Loading...</Typography>
                                }
                            </Box>
                            :
                            selection == "laptimes" ?
                                <Box padding={3} width={"100%"} alignItems={"center"}>
                                    <Typography fontWeight={"bold"} fontSize={22} sx={{ mb: 2 }}>
                                        {year} {round.slice(3)} {session} Lap Times
                                    </Typography>
                                    {
                                        lapsData.length > 1 ?
                                            <LapChart laps={lapsData} drivers={driverData} />
                                            :
                                            <Typography>Loading...</Typography>
                                    }
                                </Box>
                                :
                                selection == "pitperformance" ?
                                    <Box padding={3} width={"1700px"} maxWidth={"100%"} height={"calc(100vh - 200px)"} alignItems={"center"}>
                                        <Typography fontWeight={"bold"} fontSize={22} sx={{ mb: 2 }}>
                                            {year} {round.slice(3)} {session} Pit Performance
                                        </Typography>
                                        {
                                            lapsData.length > 1 ?
                                                <PitPerformanceChart allLapsData={lapsData} driversData={driverData} />
                                                :
                                                <Typography>Loading...</Typography>
                                        }
                                    </Box>
                                    :
                                    selection == "positions" ?
                                        <Box padding={3} width={"1900px"} maxWidth={"100%"} height={"calc(100vh - 160px)"} alignItems={"center"}>
                                            <Typography fontWeight={"bold"} fontSize={22} sx={{ mb: 2 }}>
                                                {year} {round.slice(3)} {session} Position Changes
                                            </Typography>
                                            {
                                                lapsData.length > 1 ?
                                                    <PositionChanges laps={lapsData} drivers={driverData} />
                                                    :
                                                    <Typography>Loading...</Typography>
                                            }
                                        </Box>
                                        :
                                        selection == "maxspeed" ?
                                            <Box padding={3} width={"1900px"} maxWidth={"100%"} height={"calc(100vh - 160px)"} alignItems={"center"}>
                                                <Typography fontWeight={"bold"} fontSize={22} sx={{ mb: 2 }}>
                                                    {year} {round.slice(3)} {session} Min/Max Speeds
                                                </Typography>
                                                {
                                                    lapsData.length > 1 ?
                                                        <SpeedsChart laps={lapsData} drivers={driverData} />
                                                        :
                                                        <Typography>Loading...</Typography>
                                                }
                                            </Box>
                                            :
                                            <Box padding={3} width={"1900px"} maxWidth={"100%"} height={"calc(100vh - 160px)"} alignItems={"center"}>
                                                <Typography fontWeight={"bold"} fontSize={22} sx={{ mb: 2 }}>
                                                    {year} {round.slice(3)} {session} Telemetry Comparison
                                                </Typography>
                                                {
                                                    lapsData.length > 1 ?
                                                        <SpeedDistance laps={lapsData} drivers={driverData} year={year} round={round} session={session} />
                                                        :
                                                        <Typography>Loading...</Typography>
                                                }
                                            </Box>
                }
            </Box>

        </ThemeProvider>
    );
}