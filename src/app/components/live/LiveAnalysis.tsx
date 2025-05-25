"use client";

import { LiveDriver, LiveLapData } from "@/app/utils/fetchLiveData";
import { Box, Tab, Tabs } from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import { LiveStrategy } from "./LiveStrategy";
import { LiveTelemetry } from "./LiveTelemetry";
import { fetchLiveTelemetryData } from "@/app/utils/fetchTelemetryData";
import { LapTimesLive } from "./LapTimes";

interface LiveAnalysisProps {
    lapsData: Record<number, LiveLapData[]>;
    positions: number[];
    drivers: Record<number, LiveDriver>;
}


const sections = ["Strategy View", "Lap Times", "Telemetry Comparison"];

export const LiveAnalysis: React.FC<LiveAnalysisProps> = ({
    lapsData,
    positions,
    drivers
}) => {

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




    return (
        <Box>
            <Tabs
                value={section}
                onChange={handleSectionChange}
                variant="scrollable"
                scrollButtons="auto"
                textColor="inherit"
                sx={{
                    mb: 2,
                    '& .MuiTab-root': {
                        textTransform: 'none',
                    },
                    '& .Mui-selected': {
                        color: '#d32f2f', // red-500
                    },
                    '& .MuiTabs-indicator': {
                        backgroundColor: '#d32f2f', // red-500
                    },
                }}
            >
                {sections.map((label) => (
                    <Tab key={label} label={label} value={label} />
                ))}
            </Tabs>

            <div className="mt-4">
                {section === "Strategy View" && <LiveStrategy lapsData={lapsData} positions={positions} drivers={drivers} />}
                {section === "Lap Times" && <LapTimesLive lapsData={lapsData} positions={positions} drivers={drivers} />}
                {section === "Telemetry Comparison" && <LiveTelemetry lapsData={lapsData} positions={positions} drivers={drivers} />}
            </div>
        </Box>
    );
};