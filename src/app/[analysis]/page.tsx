"use client";

import { useState, useEffect, SetStateAction } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button, Stack, TextField, Typography, ThemeProvider, CssBaseline, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import darkTheme from "../theme";
import Navbar from "../components/Navbar";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

type SessionsData = {
    [year: string]: {
      [round: string]: string[];
    };
  };

export default function SessionSelection() {
  const router = useRouter();
  const pathname = usePathname(); // Get the current path
  const basePath = pathname.split("/")[1]; // Extract analysis type (e.g., "pitPerformance")

  
  const [year, setYear] = useState("2025");
  const [round, setRound] = useState("01) Australian Grand Prix");
  const [session, setSession] = useState("Race");

  const [availableSessions, setAvailableSessions] = useState<SessionsData>({"2025": {"01) Australian Grand Prix": ["Practice 1", "Practice 2", "Practice 3", "Qualifying", "Race"]}});

  // let availableSessions: SessionsData = ;

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const docRef = doc(db, "directories", "all"); // Reference to Firestore document
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setAvailableSessions(docSnap.data() as SessionsData);

          const years = Object.keys(availableSessions);
          const cYear = years.at(-1) ?? "2025";
          changeYear(cYear);
          // setYear(cYear);
          // const rounds = Object.keys(availableSessions[cYear]);
          // const cRound = rounds.at(-1) ?? "01) Australian Grand Prix";
          // setRound(cRound);
          // const sessions = availableSessions[cYear][cRound];
          // const cSession = sessions.at(-1) ?? "Practice 1";
          // setSession(cSession);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
      }
    };

    fetchSessions();
  }, []);

  useEffect(() => {
    if (Object.keys(availableSessions).length > 0) {
      const years = Object.keys(availableSessions);
      const cYear = years.at(-1) ?? "2025";
      changeYear(cYear);
    }
  }, [availableSessions]);

  const handleGoToSession = () => {
    if (year && round && session) {
      router.push(`/${basePath}/${year}/${round}/${session}`);
    }
  };

  const changeYear = (year: string) => {
    setYear(year);
  
    // Get sorted rounds
    const rounds = availableSessions[year] 
      ? Object.keys(availableSessions[year]).sort() 
      : [];
  
    if (rounds.length > 0) {
      const firstRound = rounds[rounds.length - 1]; // First available round
      setRound(firstRound);
  
      // Get sorted sessions
      const sessions = availableSessions[year][firstRound] 
        ? [...availableSessions[year][firstRound]]
        : [];
  
      if (sessions.length > 0) {
        setSession(sessions[sessions.length - 1]);
      } else {
        setSession("");
      }
    } else {
      setRound("");
      setSession("");
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Navbar/>
        <Stack spacing={3} alignItems="center" mt={5}>

        <Typography variant="h4" fontWeight="600">Select a Race Session</Typography>

        {/* Year Dropdown */}
        <FormControl sx={{ width: 250 }} variant="outlined">
          <InputLabel shrink>Year</InputLabel>
          <Select
            value={year}
            onChange={(e) => changeYear(e.target.value)}
            label="Year"
          >
            {Object.keys(availableSessions).sort().map((yr) => (
              <MenuItem key={yr} value={yr}>{yr}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Round Dropdown */}
        <FormControl sx={{ width: 250 }} variant="outlined">
            <InputLabel shrink>Round</InputLabel>
            <Select value={round} onChange={(e) => setRound(e.target.value)} label="Round">
            {Object.keys(availableSessions[year]).sort().map((rd) => (
                <MenuItem key={rd} value={rd}>{rd}</MenuItem>
            ))}
            </Select>
        </FormControl>

        {/* Session Dropdown */}
        <FormControl sx={{ width: 250 }} variant="outlined">
            <InputLabel shrink>Session</InputLabel>
            <Select label="Session" value={session} onChange={(e) => setSession(e.target.value)}>
              {availableSessions[year] && availableSessions[year][round] 
                ? [...availableSessions[year][round]].map((sess, index) => (
                    <MenuItem key={`${year}-${round}-${index}`} value={sess}>
                      {sess}
                    </MenuItem>
                  ))
                : <MenuItem disabled>No Sessions Available</MenuItem>
              }
            </Select>
        </FormControl>

        <Button variant="contained" color="primary" onClick={handleGoToSession}>
            Go to Session
        </Button>

        </Stack>
    </ThemeProvider>
  );
}
