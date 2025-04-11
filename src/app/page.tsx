"use client";

import { useEffect, useState } from "react";
//import styles from "./Home.module.css";
import darkTheme from "./theme";
import { F1Event, fetchYearSchedule } from "./utils/fetchYearData";
import { DisplayEvents } from "./components/DisplayEvents";
import { DisplayConstructorStandings, DisplayDriverStandings } from "./components/DisplayStandings";
import { CssBaseline, ThemeProvider, Stack, Typography, Box, ToggleButtonGroup, ToggleButton } from "@mui/material";
import EmojiFlagsIcon from "@mui/icons-material/EmojiFlags";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import EngineeringIcon from "@mui/icons-material/Engineering";

import Navbar from "./components/Navbar";
import { Standings, fetchStandings } from "./utils/fetchStandings";

export default function Home() {

    const [events, setEvents] = useState<F1Event[]>([]);
    const [standings, setStandings] = useState<Standings>({ drivers: [], teams: [] });

    const [selection, setSelection] = useState("events");

    const handleChange = (_: React.MouseEvent<HTMLElement>, newSelection: string | null) => {
        if (newSelection !== null) {
            setSelection(newSelection);
        }
    };

    const loadEvents = async (year: string) => {
        let newEvents: F1Event[] = await fetchYearSchedule(year);

        console.log(newEvents);

        setEvents(newEvents)
    }

    const loadStandings = async (year: string) => {
        let standings: Standings = await fetchStandings(year);

        console.log(standings);

        setStandings(standings);
    }

    useEffect(() => {
        loadEvents("2025");
        loadStandings("2025");
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
            <Box justifyContent={"center"} justifyItems={"center"} mt={"20px"}>
                <ToggleButtonGroup
                    value={selection}
                    exclusive
                    onChange={handleChange}
                    size="medium"
                    sx={{ borderRadius: 5 }}
                >
                    <ToggleButton
                        value="events"
                        sx={toggleSx}
                    >
                        <EmojiFlagsIcon sx={{ mr: 1 }} />
                        Events
                    </ToggleButton>

                    <ToggleButton
                        value="drivers"
                        sx={toggleSx}
                    >
                        <EmojiEventsIcon sx={{ mr: 1 }} />
                        Drivers
                    </ToggleButton>

                    <ToggleButton
                        value="constructors"
                        sx={toggleSx}
                    >
                        <EngineeringIcon sx={{ mr: 1 }} />
                        Constructors
                    </ToggleButton>
                </ToggleButtonGroup>


                {/* <Box display="flex" justifyContent="center">
                    <DisplayEvents events={events} />
                </Box> */}
                {
                    selection == "events" ?
                        <Box display="flex" justifyContent="center">
                            <DisplayEvents events={events} />
                        </Box>
                        :
                        (
                        selection == "drivers" ?
                            <Box display="flex" justifyContent="center">
                                <DisplayDriverStandings standings={standings.drivers} />
                            </Box>
                            :
                            <Box display="flex" justifyContent="center">
                                <DisplayConstructorStandings standings={standings.teams} />
                            </Box>
                        )
                }
            </Box>

        </ThemeProvider>
    );
}