"use client";

import { LiveDriver, LiveLapData } from "@/app/utils/fetchLiveData";
import { Box, Tab, Tabs } from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import { LiveStrategy } from "./LiveStrategy";
import ChooseLaps from "./ChooseLapsLive";
import { fetchLiveTelemetryData } from "@/app/utils/fetchTelemetryData";
import { TelemetryFrame } from "@/app/classes/telemetryData";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import LiveLapChartGraph from "./LiveLapChart";

interface LapTimesLiveProps {
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


export const LapTimesLive: React.FC<LapTimesLiveProps> = ({
    lapsData,
    positions,
    drivers
}) => {

    const [chartKey, setKey] = useState<number>(0);

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
            
            <LiveLapChartGraph lapsData={lapsData} drivers={drivers} positions={positions} key={chartKey} />

            <ChooseLaps laps={lapsData} drivers={drivers} positions={positions} isCheckbox={true}
                onChoose={async (lap, driver) => {


                    setKey(chartKey + 1);
                }} />
        </Box>
    );
};